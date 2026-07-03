from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200

    AWS_ACCESS_KEY_ID: str = "your_aws_access_key"
    AWS_SECRET_ACCESS_KEY: str = "your_aws_secret_key"
    AWS_REGION: str = "af-south-1"
    S3_BUCKET_NAME: str = "your_s3_bucket_name"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    PAYSTACK_SECRET_KEY: str = ""

    VAPID_PUBLIC_KEY: str = "BHXYuSinot1EEdIHbO-SrbALB4e8iN9OEp5HHfm34xHulxcvcjhQMRO7bRGMBpX5O2uWkAH6vhPYSNDSJSwPAeQ"
    VAPID_PRIVATE_KEY: str = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgepKce7Aqk-TjbsQJ6EGprdn7NmCU2c2g3OmLtzI5fu6hRANCAAR12Lkop6LdRBHSB2zvkq2wCweHvIjfThKeRx35t-MR7pcXL3I4UDETu20RjAaV-TtrlpAB-r4T2EjQ0iUsDwHk"
    VAPID_EMAIL: str = "mailto:vchidiebere.vc@gmail.com"

    class Config:
        env_file = ".env"

settings = Settings()