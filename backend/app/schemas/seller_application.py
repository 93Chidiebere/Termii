from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SellerApplicationCreate(BaseModel):
    seller_type: str                # "individual" | "business"
    full_name: str
    phone_number: str
    address: str

    nin_or_bvn: Optional[str] = None       # required if seller_type == "individual"
    business_name: Optional[str] = None    # required if seller_type == "business"
    cac_number: Optional[str] = None       # required if seller_type == "business"
    tin: Optional[str] = None

    bank_code: str
    bank_account_number: str
    bank_account_name: str

    portfolio_image_urls: List[str] = Field(default_factory=list)


class SellerApplicationResponse(BaseModel):
    id: str
    seller_type: str
    full_name: str
    business_name: Optional[str] = None
    id_verification_status: Optional[str] = None
    cac_verification_status: Optional[str] = None
    fee_amount: int
    payment_status: str
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SellerApplicationAdminView(SellerApplicationResponse):
    """Extended view for admin review — includes fields applicants shouldn't see about themselves."""
    applicant_id: str
    applicant_email: str
    phone_number: str
    address: str
    bank_code: str
    bank_account_number: str
    bank_account_name: str
    portfolio_image_urls: List[str] = Field(default_factory=list)
    account_age_days_at_apply: Optional[int] = None
    payment_reference: Optional[str] = None


class SellerApplicationReviewRequest(BaseModel):
    decision: str                    # "approve" | "reject"
    rejection_reason: Optional[str] = None   # required if decision == "reject"