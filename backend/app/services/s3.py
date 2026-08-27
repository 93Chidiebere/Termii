import boto3
from botocore.exceptions import NoCredentialsError
from app.core.config import settings

from botocore.client import Config

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        endpoint_url=settings.S3_ENDPOINT_URL,
        region_name=settings.AWS_REGION,
        config=Config(signature_version='s3v4')
    )

def create_presigned_put(object_name: str, file_type: str):
    """
    Generate a presigned URL PUT request to upload a file directly to S3.
    """
    s3_client = get_s3_client()
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.S3_BUCKET_NAME,
                'Key': object_name,
                'ContentType': file_type
            },
            ExpiresIn=3600
        )
        return response
    except Exception as e:
        return None
