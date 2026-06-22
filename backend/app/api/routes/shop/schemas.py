from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    currency: str = "₦"
    quantity: int = 1
    category: str = "Other"
    delivery_location: str = ""
    media_urls: List[str] = []
    tags: List[str] = []

class SellerInfo(BaseModel):
    id: str
    name: str
    avatar: str = ""
    rating: float = 5.0
    completed_orders: int = 0
    location: str = ""
    verification_status: str = "unverified"
    seller_type: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    title: str
    description: str
    price: float
    currency: str
    quantity: int
    category: str
    delivery_location: str
    media_urls: List[str]
    tags: List[str]
    is_trending: bool
    is_new: bool
    status: str
    seller: SellerInfo
    created_at: str

    model_config = {"from_attributes": True}