from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.user import User
from app.services import paystack
from app.api.routes.auth import get_current_user
from app.api.dependencies import get_current_admin

router = APIRouter()


class BankInfo(BaseModel):
    name: str
    code: str


# ── GET /sellers/banks — list Nigerian banks ──────────────────────────────────
# Still used by the seller-application form to populate the bank dropdown.
@router.get("/banks", response_model=List[BankInfo])
async def list_banks():
    try:
        banks = await paystack.get_bank_list()
        return [BankInfo(name=b["name"], code=b["code"]) for b in banks]
    except Exception:
        raise HTTPException(status_code=502, detail="Could not fetch bank list from Paystack")


# ── POST /sellers/verify-account — verify bank account before applying ────────
# Still used by the seller-application form before submission.
@router.post("/verify-account")
async def verify_account(bank_code: str, account_number: str):
    result = await paystack.verify_bank_account(account_number, bank_code)
    if not result:
        raise HTTPException(status_code=400, detail="Could not verify this bank account. Check the number and bank.")
    return result  # { account_name, account_number }


# ── DEPRECATED ─────────────────────────────────────────────────────────────────
# POST /sellers/onboard has been removed. Selling now requires an approved
# SellerApplication (see api/routes/seller_applications.py) — payment, manual
# admin review, and badge issuance replace the old instant self-serve onboarding.
#
# NOTE: /pending and /{user_id}/verify below operated on the old
# User.verification_status field set directly by the removed onboarding flow.
# They are left in place only because Admin.tsx has not been reviewed yet —
# confirm whether Admin.tsx still calls getPendingSellers/verifySeller before
# removing these. If Admin.tsx is migrated to the new
# /seller-applications/admin/pending and /admin/{id}/review endpoints, these
# two routes below can be deleted.

class PendingSellerResponse(BaseModel):
    id: str
    full_name: str
    email: str
    seller_type: str
    business_name: Optional[str] = None
    cac_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    verification_status: str


@router.get("/pending", response_model=List[PendingSellerResponse])
async def list_pending_sellers(admin: User = Depends(get_current_admin)):
    sellers = await User.find(
        User.verification_status == "pending"
    ).to_list()
    return [
        PendingSellerResponse(
            id=str(s.id),
            full_name=s.full_name,
            email=s.email,
            seller_type=s.seller_type or "individual",
            business_name=s.business_name,
            cac_number=s.cac_number,
            bank_account_name=s.bank_account_name,
            verification_status=s.verification_status,
        )
        for s in sellers
    ]


class VerificationDecision(BaseModel):
    approve: bool
    notes: Optional[str] = None


@router.put("/{user_id}/verify")
async def verify_seller(
    user_id: str,
    decision: VerificationDecision,
    admin: User = Depends(get_current_admin),
):
    target = await User.get(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Seller not found")

    target.verification_status = "verified" if decision.approve else "rejected"
    await target.save()

    return {
        "id": str(target.id),
        "verification_status": target.verification_status,
    }