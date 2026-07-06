from beanie import Document, Link
from typing import Optional, List
from datetime import datetime
from pydantic import Field
from app.models.user import User


class SellerApplication(Document):
    applicant: Link[User]

    # ── Applicant-submitted data ──────────────────────────────────────────────
    seller_type: str                          # "individual" | "business"
    full_name: str
    phone_number: str
    address: str

    # Individual verification
    nin_or_bvn: Optional[str] = None           # sent to KYC provider, not stored raw long-term
    id_verification_ref: Optional[str] = None  # reference id from provider (Youverify/Smile ID/etc)
    id_verification_status: Optional[str] = None   # "pending" | "matched" | "failed"

    # Corporate verification
    business_name: Optional[str] = None
    cac_number: Optional[str] = None
    cac_verification_status: Optional[str] = None  # "pending" | "matched" | "failed"
    tin: Optional[str] = None

    # Banking (reused for Paystack subaccount on approval)
    bank_code: str
    bank_account_number: str
    bank_account_name: str

    # Portfolio / trust signal
    portfolio_image_urls: List[str] = Field(default_factory=list)

    # ── Payment ────────────────────────────────────────────────────────────────
    fee_amount: int                            # 10000 or 50000 (kobo handled at charge time)
    payment_reference: Optional[str] = None
    payment_status: str = "pending"            # "pending" | "paid" | "failed"

    # ── Review lifecycle ───────────────────────────────────────────────────────
    status: str = "pending_payment"
    # "pending_payment" | "pending_review" | "approved" | "rejected"
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[Link[User]] = None
    reviewed_at: Optional[datetime] = None

    account_age_days_at_apply: Optional[int] = None  # snapshot for audit trail

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "seller_applications"