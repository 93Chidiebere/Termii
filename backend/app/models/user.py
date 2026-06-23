from beanie import Document, Indexed
from typing import Optional, List
from datetime import datetime
from pydantic import Field

class User(Document):
    email: Indexed(str, unique=True)
    hashed_password: Optional[str] = None
    full_name: str
    username: Optional[Indexed(str, unique=True)] = None
    avatar_url: Optional[str] = None
    hair_type: Optional[Indexed(str)] = None

    # ── Structured hair profile ───────────────────────────────────────────────
    hair_porosity: Optional[str] = None
    hair_density: Optional[str] = None
    hair_pattern: Optional[str] = None
    hair_length: Optional[str] = None
    hair_goals: Optional[List[str]] = None
    hair_treatments: Optional[List[str]] = None

    # ── Seller / marketplace fields ───────────────────────────────────────────
    seller_type: Optional[str] = None        # "individual" | "business"
    business_name: Optional[str] = None
    cac_number: Optional[str] = None
    bank_code: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    paystack_subaccount_code: Optional[str] = None
    verification_status: str = "unverified"  # "unverified" | "pending" | "verified"

    is_admin: bool = False
    status: str = "active"  # "active" | "suspended" | "banned"
    suspension_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"