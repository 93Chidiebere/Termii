from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URI)

    from app.models.user import User
    from app.models.post import Post
    from app.models.message import Message
    from app.api.routes.shop.models import Product
    from app.api.routes.posts import PostLike, PostSave, PostComment

    await init_beanie(
        database=client.get_default_database(),
        document_models=[User, Post, Message, Product, PostLike, PostSave, PostComment]
    )