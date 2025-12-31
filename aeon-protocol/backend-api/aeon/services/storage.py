from __future__ import annotations

import hashlib
import mimetypes
import os
from dataclasses import dataclass
from typing import Dict, Any, Optional

import boto3
import httpx

from aeon.core.config import Settings


@dataclass
class StoredAsset:
    id: str
    url: str
    sha256: str
    mime: str
    size: int


class StorageService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.s3 = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
        )

    async def _download_stream(self, source_url: str):  # type: ignore[no-untyped-def]
        async with httpx.AsyncClient(timeout=30) as client:
            async with client.stream("GET", source_url) as resp:
                resp.raise_for_status()
                async for chunk in resp.aiter_bytes():
                    yield chunk

    async def store_asset(self, payload: bytes | str, kind: str) -> StoredAsset:
        bucket = self._bucket_for_kind(kind)
        hasher = hashlib.sha256()
        content: bytes
        if isinstance(payload, str) and payload.startswith("http"):
            chunks = []
            async for chunk in self._download_stream(payload):
                hasher.update(chunk)
                chunks.append(chunk)
            content = b"".join(chunks)
            mime = mimetypes.guess_type(payload)[0] or "application/octet-stream"
        elif isinstance(payload, bytes):
            content = payload
            hasher.update(content)
            mime = "application/octet-stream"
        else:
            raise ValueError("payload must be bytes or URL")

        sha256_hex = hasher.hexdigest()
        key = f"{kind}/{sha256_hex}"
        self.s3.put_object(Bucket=bucket, Key=key, Body=content, ContentType=mime, ServerSideEncryption="AES256")
        url = f"{self.settings.s3_endpoint}/{bucket}/{key}"
        return StoredAsset(id=sha256_hex, url=url, sha256=sha256_hex, mime=mime, size=len(content))

    def _bucket_for_kind(self, kind: str) -> str:
        base = self.settings.s3_bucket
        mapping = {
            "video": f"{base}-video",
            "image": f"{base}-image",
            "audio": f"{base}-audio",
            "tmp": f"{base}-tmp",
        }
        if kind not in mapping:
            raise ValueError("invalid kind")
        return mapping[kind]
