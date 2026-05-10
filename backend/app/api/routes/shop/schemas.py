from pydantic import BaseModel
from typing import List
from datetime import datetime

class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    quantity: int
    delivery_location: str
    media_urls: List[str] = []

class ProductResponse(ProductCreate):
    id: str
    seller_id: str
    status: str
    created_at: datetime
