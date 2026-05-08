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

app = FastAPI(title="Termii API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import auth, posts, chat, twins
from app.api.routes.shop import routes as shop

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])
app.include_router(shop.router, prefix="/shop", tags=["shop"])
app.include_router(twins.router, prefix="/twins", tags=["twins"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Termii API"}
