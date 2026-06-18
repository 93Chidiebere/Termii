from beanie import Document, Indexed
from typing import Optional, List
from datetime import datetime
from pydantic import Field

class User(Document):
    email: Indexed(str, unique=True)
    hashed_password: Optional[str] = None
    full_name: str
    avatar_url: Optional[str] = None
    hair_type: Optional[Indexed(str)] = None

    # ── Structured hair profile ───────────────────────────────────────────────
    hair_porosity: Optional[str] = None       # Low / Medium / High
    hair_density: Optional[str] = None        # Low / Medium / High
    hair_pattern: Optional[str] = None        # Straight / Wavy / Curly / Coily
    hair_length: Optional[str] = None         # TWA / Ear / Chin / Shoulder / Armpit / Waist+
    hair_goals: Optional[List[str]] = None    # ["Length Retention", "Moisture", ...]
    hair_treatments: Optional[List[str]] = None  # ["Heat Styling", "Color Treated", ...]

    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"