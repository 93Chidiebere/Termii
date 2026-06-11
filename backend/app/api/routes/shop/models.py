from beanie import Document, Link, Indexed
from typing import List, Optional
from datetime import datetime
from pydantic import Field
from app.models.user import User

class Product(Document):
    seller: Link[User]
    title: Indexed(str)
    description: str
    price: float
    currency: str = "₦"
    quantity: int = 1
    category: str = "Other"
    delivery_location: str = ""
    media_urls: List[str] = []
    tags: List[str] = []
    is_trending: bool = False
    is_new: bool = True
    status: Indexed(str) = "PENDING"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "products"