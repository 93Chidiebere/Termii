from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.blog import BlogPost
from app.models.push_subscription import PushSubscription
from app.models.seller_application import SellerApplication

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URI)

    from app.models.user import User
    from app.models.post import Post
    from app.models.message import Message
    from app.models.order import Order
    from app.api.routes.shop.models import Product
    from app.api.routes.posts import PostLike, PostSave, PostComment, CommentLike
    from app.api.routes.follows import Follow

    await init_beanie(
        database=client.get_default_database(),
        document_models=[User, Post, Message, Product, PostLike, PostSave, PostComment, Follow, Order, BlogPost, PushSubscription, SellerApplication, CommentLike]
    )