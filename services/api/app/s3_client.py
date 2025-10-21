import os
import boto3
from botocore.exceptions import ClientError
from typing import Optional
from urllib.parse import urlparse, urlunparse

# S3 configuration
S3_BUCKET = os.environ.get("S3_BUCKET", "aeon-dev-bucket")
S3_ENDPOINT = os.environ.get("S3_ENDPOINT")
S3_PUBLIC_ENDPOINT = os.environ.get("S3_PUBLIC_ENDPOINT")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
S3_FORCE_PATH_STYLE = os.environ.get("S3_FORCE_PATH_STYLE", "false").lower() == "true"

# Configure S3 client
s3_config = {
    "aws_access_key_id": AWS_ACCESS_KEY_ID,
    "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
    "region_name": AWS_REGION
}

if S3_ENDPOINT:
    s3_config["endpoint_url"] = S3_ENDPOINT

if S3_FORCE_PATH_STYLE:
    s3_config["config"] = boto3.session.Config(s3={"addressing_style": "path"})

s3_client = boto3.client("s3", **s3_config)

def generate_presigned_url(s3_key: str, bucket: str = S3_BUCKET, expiration: int = 3600) -> Optional[str]:
    """Generate a presigned URL for S3 object"""
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': s3_key},
            ExpiresIn=expiration
        )
        # In dev with LocalStack, rewrite internal host to public host if provided
        if S3_PUBLIC_ENDPOINT:
            try:
                original = urlparse(url)
                public = urlparse(S3_PUBLIC_ENDPOINT)
                # Keep path/query/signature intact, swap scheme+netloc
                url = urlunparse((public.scheme or original.scheme, public.netloc or original.netloc, original.path, original.params, original.query, original.fragment))
            except Exception:
                pass
        return url
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        return None

def create_bucket_if_not_exists(bucket: str = S3_BUCKET):
    """Create S3 bucket if it doesn't exist (for LocalStack)"""
    try:
        s3_client.head_bucket(Bucket=bucket)
    except ClientError as e:
        error_code = int(e.response['Error']['Code'])
        if error_code == 404:
            # Bucket doesn't exist, create it
            try:
                if AWS_REGION == 'us-east-1':
                    s3_client.create_bucket(Bucket=bucket)
                else:
                    s3_client.create_bucket(
                        Bucket=bucket,
                        CreateBucketConfiguration={'LocationConstraint': AWS_REGION}
                    )
                print(f"Created bucket: {bucket}")
            except ClientError as create_error:
                print(f"Error creating bucket: {create_error}")
        else:
            print(f"Error checking bucket: {e}")

def upload_file(file_content: bytes, s3_key: str, content_type: str = "application/octet-stream", bucket: str = S3_BUCKET) -> bool:
    """Upload file content to S3"""
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type
        )
        return True
    except ClientError as e:
        print(f"Error uploading file: {e}")
        return False
