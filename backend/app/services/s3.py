import boto3
from botocore.exceptions import NoCredentialsError
from app.core.config import settings

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        endpoint_url=settings.S3_ENDPOINT_URL,
        region_name=settings.AWS_REGION
    )

def create_presigned_post(object_name: str, file_type: str):
    """
    Generate a presigned URL POST request to upload a file directly to S3.
    This keeps the FastAPI backend fast as it doesn't process the file payload.
    """
    s3_client = get_s3_client()
    try:
        response = s3_client.generate_presigned_post(
            Bucket=settings.S3_BUCKET_NAME,
            Key=object_name,
            Fields={"Content-Type": file_type},
            Conditions=[
                {"Content-Type": file_type},
                ["content-length-range", 0, 104857600] # max 100MB
            ],
            ExpiresIn=3600
        )
        return response
    except Exception as e:
        return None
