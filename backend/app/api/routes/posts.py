from fastapi import APIRouter, Depends
from typing import List
from app.schemas.post import PostCreate, PostResponse
from app.models.post import Post
from app.models.user import User
from app.api.dependencies import get_current_user
from app.services.s3 import create_presigned_post

router = APIRouter()

@router.post("/", response_model=PostResponse)
async def create_post(post_in: PostCreate, current_user: User = Depends(get_current_user)):
    post = Post(user=current_user, **post_in.dict())
    await post.insert()
    return post

@router.get("/", response_model=List[PostResponse])
async def get_posts():
    # In a real app, add pagination here
    posts = await Post.find_all().to_list()
    return posts

@router.get("/presigned-url")
async def get_presigned_url(file_type: str, current_user: User = Depends(get_current_user)):
    # e.g., file_type = "image/jpeg"
    import uuid
    object_name = f"posts/{current_user.id}/{uuid.uuid4()}"
    return create_presigned_post(object_name, file_type)
