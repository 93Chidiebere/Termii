from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

async def init_db():
    # Initialize Motor Client
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    
    # We will pass all our Beanie models to `document_models`
    # We'll import them dynamically or pass them when models are created
    # For now, we leave it empty, we'll update it later
    from app.models.user import User
    from app.models.post import Post
    from app.models.message import Message
    from app.api.routes.shop.models import Product

    await init_beanie(
        database=client.get_default_database(),
        document_models=[User, Post, Message, Product]
    )
