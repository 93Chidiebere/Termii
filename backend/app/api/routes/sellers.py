from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.user import User
from app.api.routes.auth import get_current_user
from app.services import paystack

router = APIRouter()


class BankInfo(BaseModel):
    name: str
    code: str


class OnboardSellerRequest(BaseModel):
    seller_type: str  # "individual" | "business"
    business_name: Optional[str] = None
    cac_number: Optional[str] = None
    bank_code: str
    bank_account_number: str


class OnboardSellerResponse(BaseModel):
    seller_type: str
    verification_status: str
    bank_account_name: Optional[str] = None
    subaccount_created: bool


# ── GET /sellers/banks — list Nigerian banks ──────────────────────────────────
@router.get("/banks", response_model=List[BankInfo])
async def list_banks():
    try:
        banks = await paystack.get_bank_list()
        return [BankInfo(name=b["name"], code=b["code"]) for b in banks]
    except Exception:
        raise HTTPException(status_code=502, detail="Could not fetch bank list from Paystack")


# ── POST /sellers/verify-account — verify bank account before onboarding ──────
@router.post("/verify-account")
async def verify_account(bank_code: str, account_number: str):
    result = await paystack.verify_bank_account(account_number, bank_code)
    if not result:
        raise HTTPException(status_code=400, detail="Could not verify this bank account. Check the number and bank.")
    return result  # { account_name, account_number }


# ── POST /sellers/onboard — register as a seller and create Paystack subaccount ──
@router.post("/onboard", response_model=OnboardSellerResponse)
async def onboard_seller(
    onboard_in: OnboardSellerRequest,
    current_user: User = Depends(get_current_user),
):
    if onboard_in.seller_type not in ("individual", "business"):
        raise HTTPException(status_code=400, detail="seller_type must be 'individual' or 'business'")

    if onboard_in.seller_type == "business" and not onboard_in.business_name:
        raise HTTPException(status_code=400, detail="business_name is required for business sellers")

    # Step 1 — Verify the bank account is real
    account_info = await paystack.verify_bank_account(
        onboard_in.bank_account_number, onboard_in.bank_code
    )
    if not account_info:
        raise HTTPException(status_code=400, detail="Could not verify bank account details")

    display_name = onboard_in.business_name or current_user.full_name

    # Step 2 — Create the Paystack subaccount
    subaccount = await paystack.create_subaccount(
        business_name=display_name,
        bank_code=onboard_in.bank_code,
        account_number=onboard_in.bank_account_number,
    )

    if not subaccount:
        raise HTTPException(status_code=502, detail="Could not create payment account. Please try again.")

    # Step 3 — Save everything to the user record
    current_user.seller_type = onboard_in.seller_type
    current_user.business_name = onboard_in.business_name
    current_user.cac_number = onboard_in.cac_number
    current_user.bank_code = onboard_in.bank_code
    current_user.bank_account_number = onboard_in.bank_account_number
    current_user.bank_account_name = account_info.get("account_name")
    current_user.paystack_subaccount_code = subaccount.get("subaccount_code")
    current_user.verification_status = (
        "pending" if onboard_in.seller_type == "business" else "verified"
    )
    await current_user.save()

    return OnboardSellerResponse(
        seller_type=onboard_in.seller_type,
        verification_status=current_user.verification_status,
        bank_account_name=current_user.bank_account_name,
        subaccount_created=True,
    )