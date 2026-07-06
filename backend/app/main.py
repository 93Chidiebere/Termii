from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database on startup
    await init_db()
    yield
    # Cleanup on shutdown

app = FastAPI(title="Termii", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import auth, posts, chat, twins, follows, sellers, orders, admin_users, blog, push, seller_applications
from app.api.routes.shop import routes as shop

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])
app.include_router(shop.router, prefix="/shop", tags=["shop"])
app.include_router(twins.router, prefix="/twins", tags=["twins"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(follows.router, prefix="/follows", tags=["follows"])
app.include_router(sellers.router, prefix="/sellers", tags=["sellers"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(admin_users.router, prefix="/admin", tags=["admin"])
app.include_router(blog.router, prefix="/blog", tags=["blog"])
app.include_router(push.router, prefix="/push", tags=["push"])
app.include_router(seller_applications.router, prefix="/seller-applications", tags=["seller-applications"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Termii Africa API"}