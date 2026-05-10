from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str 
    JWT_SECRET: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    S3_BUCKET_NAME: str

    # Optional: These have defaults if not found in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    AWS_REGION: str = "af-south-1"

    class Config:
        env_file = ".env"

settings = Settings()
