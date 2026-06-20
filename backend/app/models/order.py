from beanie import Document, Indexed
from typing import Optional
from datetime import datetime
from pydantic import Field

class Order(Document):
    product_id: str
    buyer_id: str
    seller_id: str
    amount: float
    currency: str = "₦"
    status: Indexed(str) = "pending"  # pending | paid | shipped | delivered | released | disputed | refunded
    paystack_reference: Optional[str] = None
    delivery_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "orders"