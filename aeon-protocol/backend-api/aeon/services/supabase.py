from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx

from aeon.core.config import Settings


class SupabaseClient:
    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.supabase_url.rstrip("/")
        self.key = settings.supabase_service_role_key
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def rpc(self, fn: str, args: Dict[str, Any]) -> Any:
        url = f"{self.base_url}/rest/v1/rpc/{fn}"
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, headers=self.headers, json=args)
            r.raise_for_status()
            return r.json()

    async def insert(self, table: str, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, headers=self.headers, json=rows)
            r.raise_for_status()
            return r.json()

    async def select_one(self, table: str, eq: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/rest/v1/{table}"
        params = {f"{k}.eq": v for k, v in eq.items()}
        params["limit"] = 1
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=self.headers, params=params)
            r.raise_for_status()
            data = r.json()
            return data[0] if data else None

    async def select(self, table: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=self.headers, params=params)
            r.raise_for_status()
            return r.json()

    async def update(self, table: str, eq: Dict[str, Any], patch: Dict[str, Any]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/rest/v1/{table}"
        params = {f"{k}.eq": v for k, v in eq.items()}
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.patch(url, headers=self.headers, params=params, json=patch)
            r.raise_for_status()
            return r.json()
