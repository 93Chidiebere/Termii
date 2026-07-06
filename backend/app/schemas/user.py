from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    username: Optional[str] = None
    hair_type: Optional[str] = None
    date_of_birth: date

class UserResponse(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    full_name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    hair_type: Optional[str] = None
    is_admin: bool = False

    # Age verification
    date_of_birth: Optional[date] = None
    age_verified: bool = False

    # Hair profile
    hair_porosity: Optional[str] = None
    hair_density: Optional[str] = None
    hair_pattern: Optional[str] = None
    hair_length: Optional[str] = None
    hair_goals: Optional[List[str]] = None
    hair_treatments: Optional[List[str]] = None

    # Seller fields
    seller_type: Optional[str] = None
    business_name: Optional[str] = None
    verification_status: str = "unverified"
    paystack_subaccount_code: Optional[str] = None
    is_seller: bool = False
    badge_issued_at: Optional[datetime] = None
    badge_expires_at: Optional[datetime] = None
    listing_cap: int = 20
    active_listing_count: int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def from_mongo(cls, user):
        return cls(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            username=getattr(user, "username", None),
            avatar_url=user.avatar_url,
            hair_type=user.hair_type,
            is_admin=user.is_admin,
            date_of_birth=getattr(user, "date_of_birth", None),
            age_verified=getattr(user, "age_verified", False),
            hair_porosity=getattr(user, "hair_porosity", None),
            hair_density=getattr(user, "hair_density", None),
            hair_pattern=getattr(user, "hair_pattern", None),
            hair_length=getattr(user, "hair_length", None),
            hair_goals=getattr(user, "hair_goals", None),
            hair_treatments=getattr(user, "hair_treatments", None),
            seller_type=getattr(user, "seller_type", None),
            business_name=getattr(user, "business_name", None),
            verification_status=getattr(user, "verification_status", "unverified"),
            paystack_subaccount_code=getattr(user, "paystack_subaccount_code", None),
            is_seller=getattr(user, "is_seller", False),
            badge_issued_at=getattr(user, "badge_issued_at", None),
            badge_expires_at=getattr(user, "badge_expires_at", None),
            listing_cap=getattr(user, "listing_cap", 20),
            active_listing_count=getattr(user, "active_listing_count", 0),
        )