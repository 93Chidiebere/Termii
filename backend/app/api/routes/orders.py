from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import hashlib
import hmac
import uuid

from app.models.user import User
from app.models.order import Order
from app.api.routes.shop.models import Product
from app.api.dependencies import get_current_user
from app.services import paystack
from app.core.config import settings

router = APIRouter()


class CreateOrderRequest(BaseModel):
    product_id: str
    delivery_address: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    product_id: str
    product_title: str
    buyer_id: str
    seller_id: str
    amount: float
    currency: str
    status: str
    paystack_reference: Optional[str] = None
    delivery_address: Optional[str] = None
    created_at: str


def order_to_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=str(order.id),
        product_id=order.product_id,
        product_title=order.product_title,
        buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        amount=order.amount,
        currency=order.currency,
        status=order.status,
        paystack_reference=order.paystack_reference,
        delivery_address=order.delivery_address,
        created_at=order.created_at.isoformat(),
    )


# ── POST /orders/ — buyer initiates a purchase ────────────────────────────────
@router.post("/")
async def create_order(
    order_in: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
):
    product = await Product.get(order_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await product.fetch_link(Product.seller)
    seller = product.seller
    if not hasattr(seller, "id"):
        raise HTTPException(status_code=404, detail="Seller not found")

    if str(seller.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="You cannot buy your own product")

    if not seller.paystack_subaccount_code:
        raise HTTPException(status_code=400, detail="This seller hasn't completed payout setup yet")

    reference = f"termii-{uuid.uuid4().hex[:16]}"

    order = Order(
        product_id=str(product.id),
        product_title=product.title,
        buyer_id=str(current_user.id),
        seller_id=str(seller.id),
        amount=product.price,
        currency=product.currency,
        status="pending",
        paystack_reference=reference,
        delivery_address=order_in.delivery_address,
    )
    await order.insert()

    amount_kobo = int(product.price * 100)
    callback_url = "https://termii.vercel.app/orders/callback"

    payment = await paystack.initialize_transaction(
        email=current_user.email,
        amount_kobo=amount_kobo,
        reference=reference,
        callback_url=callback_url,
    )

    if not payment:
        raise HTTPException(status_code=502, detail="Could not initialize payment. Please try again.")

    return {
        "order": order_to_response(order),
        "authorization_url": payment.get("authorization_url"),
    }


# ── GET /orders/my-purchases — buyer's orders ─────────────────────────────────
@router.get("/my-purchases", response_model=List[OrderResponse])
async def get_my_purchases(current_user: User = Depends(get_current_user)):
    orders = await Order.find(
        Order.buyer_id == str(current_user.id)
    ).sort(-Order.created_at).to_list()
    return [order_to_response(o) for o in orders]


# ── GET /orders/my-sales — seller's orders ────────────────────────────────────
@router.get("/my-sales", response_model=List[OrderResponse])
async def get_my_sales(current_user: User = Depends(get_current_user)):
    orders = await Order.find(
        Order.seller_id == str(current_user.id)
    ).sort(-Order.created_at).to_list()
    return [order_to_response(o) for o in orders]


# ── GET /orders/verify/{reference} — frontend polls this after redirect ──────
@router.get("/verify/{reference}")
async def verify_order(
    reference: str,
    current_user: User = Depends(get_current_user),
):
    order = await Order.find_one(Order.paystack_reference == reference)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "pending":
        result = await paystack.verify_transaction(reference)
        if result and result.get("status") == "success":
            order.status = "paid"
            order.updated_at = datetime.utcnow()
            await order.save()

    return order_to_response(order)


# ── PUT /orders/{order_id}/ship — seller marks as shipped ────────────────────
@router.put("/{order_id}/ship")
async def mark_shipped(
    order_id: str,
    current_user: User = Depends(get_current_user),
):
    order = await Order.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your order to update")
    if order.status != "paid":
        raise HTTPException(status_code=400, detail="Order must be paid before shipping")

    order.status = "shipped"
    order.updated_at = datetime.utcnow()
    await order.save()
    return order_to_response(order)


# ── PUT /orders/{order_id}/deliver — buyer confirms delivery, releases funds ──
@router.put("/{order_id}/deliver")
async def confirm_delivery(
    order_id: str,
    current_user: User = Depends(get_current_user),
):
    order = await Order.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.buyer_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your order to confirm")
    if order.status != "shipped":
        raise HTTPException(status_code=400, detail="Order must be shipped before confirming delivery")

    seller = await User.get(order.seller_id)
    if not seller or not seller.paystack_subaccount_code:
        raise HTTPException(status_code=400, detail="Seller payout details missing")

    # Create transfer recipient if we haven't already
    if not order.transfer_recipient_code:
        recipient = await paystack.create_transfer_recipient(
            subaccount_code=seller.paystack_subaccount_code,
            name=seller.bank_account_name or seller.full_name,
            bank_code=seller.bank_code,
            account_number=seller.bank_account_number,
        )
        if not recipient:
            raise HTTPException(status_code=502, detail="Could not set up payout recipient")
        order.transfer_recipient_code = recipient.get("recipient_code")

    # Release escrowed funds — commission stays with Ngala Africa by sending only 90%
    commission_rate = 0.10
    payout_amount = order.amount * (1 - commission_rate)
    amount_kobo = int(payout_amount * 100)

    transfer = await paystack.initiate_transfer(
        recipient_code=order.transfer_recipient_code,
        amount_kobo=amount_kobo,
        reason=f"Ngala Africa order payout: {order.product_title}",
    )

    if not transfer:
        raise HTTPException(status_code=502, detail="Could not release payment to seller. Support has been notified.")

    order.status = "released"
    order.updated_at = datetime.utcnow()
    await order.save()
    return order_to_response(order)


# ── POST /orders/webhook — Paystack server-to-server confirmation ────────────
@router.post("/webhook")
async def paystack_webhook(request: Request, x_paystack_signature: str = Header(None)):
    body = await request.body()

    # Verify the webhook actually came from Paystack
    computed_signature = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
        body,
        hashlib.sha512,
    ).hexdigest()

    if computed_signature != x_paystack_signature:
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    event = payload.get("event")

    if event == "charge.success":
        reference = payload["data"]["reference"]
        order = await Order.find_one(Order.paystack_reference == reference)
        if order and order.status == "pending":
            order.status = "paid"
            order.updated_at = datetime.utcnow()
            await order.save()

    return {"status": "ok"}