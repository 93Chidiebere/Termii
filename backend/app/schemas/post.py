from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PostCreate(BaseModel):
    type: str # "TEXT", "IMAGE", "VIDEO"
    caption: Optional[str] = None
    hashtags: List[str] = []
    hair_type: Optional[str] = None
    # For IMAGE or VIDEO, frontend will upload to S3 using Presigned URL and then send the media_url here
    media_url: Optional[str] = None

class PostResponse(PostCreate):
    id: str
    user_id: str
    created_at: datetime
