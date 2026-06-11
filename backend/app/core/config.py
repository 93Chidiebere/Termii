from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    AWS_ACCESS_KEY_ID: str = "your_aws_access_key"
    AWS_SECRET_ACCESS_KEY: str = "your_aws_secret_key"
    AWS_REGION: str = "af-south-1"
    S3_BUCKET_NAME: str = "your_s3_bucket_name"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()