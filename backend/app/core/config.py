from pydantic_settings import BaseSettings

class Settings(BaseSettings):
<<<<<<< HEAD
    MONGODB_URI: str 
    JWT_SECRET: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    S3_BUCKET_NAME: str

    # Optional: These have defaults if not found in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    AWS_REGION: str = "af-south-1"
=======
    MONGODB_URI: str = "mongodb://localhost:27017/termii"
    JWT_SECRET: str = "your_jwt_secret_key_here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    AWS_ACCESS_KEY_ID: str = "your_aws_access_key"
    AWS_SECRET_ACCESS_KEY: str = "your_aws_secret_key"
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "your_s3_bucket_name"

    class Config:
        env_file = ".env"

settings = Settings()
