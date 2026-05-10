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
    quantity: int
    delivery_location: str
    media_urls: List[str] = []
    status: Indexed(str) = "PENDING" # PENDING, APPROVED, REJECTED
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "products"
