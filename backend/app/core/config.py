from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017/termii"
    JWT_SECRET: str = "your_jwt_secret_key_here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    AWS_ACCESS_KEY_ID: str = "your_aws_access_key"
    AWS_SECRET_ACCESS_KEY: str = "your_aws_secret_key"
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "your_s3_bucket_name"
    
    GOOGLE_CLIENT_ID: str = "your_google_client_id"
    GOOGLE_CLIENT_SECRET: str = "your_google_client_secret"

    class Config:
        env_file = ".env"

settings = Settings()
