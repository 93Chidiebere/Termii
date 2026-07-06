from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.api.routes.shop.schemas import ProductCreate, ProductResponse, SellerInfo
from app.api.routes.shop.models import Product
from app.models.user import User
from app.api.dependencies import get_current_user, get_current_admin, require_age_verified

router = APIRouter()


def build_product_response(product: Product, seller: User) -> ProductResponse:
    return ProductResponse(
        id=str(product.id),
        title=product.title,
        description=product.description,
        price=product.price,
        currency=product.currency,
        quantity=product.quantity,
        category=product.category,
        delivery_location=product.delivery_location,
        media_urls=product.media_urls,
        tags=product.tags,
        is_trending=product.is_trending,
        is_new=product.is_new,
        status=product.status,
        seller=SellerInfo(
            id=str(seller.id),
            name=seller.full_name,
            avatar=seller.avatar_url or "",
            rating=5.0,
            completed_orders=0,
            location="",
            verification_status=getattr(seller, "verification_status", "unverified"),
            seller_type=getattr(seller, "seller_type", None),
        ),
        created_at=product.created_at.isoformat(),
    )


# ── POST /shop/ — list a new product ─────────────────────────────────────────
@router.post("/", response_model=ProductResponse)
async def create_product(
    product_in: ProductCreate,
    current_user: User = Depends(get_current_user),
    _age_check: User = Depends(require_age_verified),
):
    product = Product(
        seller=current_user,
        title=product_in.title,
        description=product_in.description,
        price=product_in.price,
        currency=product_in.currency,
        quantity=product_in.quantity,
        category=product_in.category,
        delivery_location=product_in.delivery_location,
        media_urls=product_in.media_urls,
        tags=product_in.tags,
        status="APPROVED",
    )
    await product.insert()
    await product.fetch_link(Product.seller)
    return build_product_response(product, current_user)


# ── GET /shop/ — fetch all approved products ──────────────────────────────────
@router.get("/", response_model=List[ProductResponse])
async def get_approved_products(
    _age_check: User = Depends(require_age_verified),
):
    products = await Product.find(Product.status == "APPROVED").to_list()
    result = []
    for product in products:
        await product.fetch_link(Product.seller)
        seller = product.seller
        if hasattr(seller, "id"):
            result.append(build_product_response(product, seller))
    return result


# ── GET /shop/{product_id} — fetch a single product ──────────────────────────
@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    _age_check: User = Depends(require_age_verified),
):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await product.fetch_link(Product.seller)
    seller = product.seller
    if not hasattr(seller, "id"):
        raise HTTPException(status_code=404, detail="Seller not found")
    return build_product_response(product, seller)


# ── PUT /shop/{product_id}/approve — admin approval ───────────────────────────
@router.put("/{product_id}/approve")
async def approve_product(
    product_id: str,
    admin: User = Depends(get_current_admin),
):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = "APPROVED"
    await product.save()
    return {"message": "Product approved"}