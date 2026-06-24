from beanie import Document, Indexed
from typing import List, Optional
from datetime import datetime
from pydantic import Field, BaseModel


class BlogBlock(BaseModel):
    type: str  # "text" | "image"
    content: str  # markdown text, or image URL
    is_thumbnail: bool = False  # only relevant for image blocks


class BlogPost(Document):
    title: str
    slug: Indexed(str, unique=True)
    summary: str  # max 500 chars, enforced at API level
    blocks: List[BlogBlock] = []
    author_id: str
    author_name: str
    status: str = "draft"  # "draft" | "published"
    is_pinned: bool = False
    pinned_order: Optional[int] = None  # 0-4 when pinned, controls display order
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    og_image: Optional[str] = None

    class Settings:
        name = "blog_posts"