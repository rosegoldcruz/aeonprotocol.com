from __future__ import annotations

from typing import Any, Dict, List, Optional

from aeon.services.supabase import SupabaseClient


class JobsService:
    def __init__(self, supabase: SupabaseClient) -> None:
        self.supabase = supabase

    async def create_job(self, user_id: str, kind: str, prompt: Dict[str, Any], cost: int, provider: str) -> Dict[str, Any]:
        rows = await self.supabase.insert("jobs", [
            {
                "user_id": user_id,
                "kind": kind,
                "prompt": prompt,
                "status": "QUEUED",
                "cost_credits": cost,
                "provider": provider,
            }
        ])
        return rows[0]

    async def update_status(self, job_id: str, status: str, progress: Optional[int] = None, error: Optional[str] = None) -> Dict[str, Any]:
        patch: Dict[str, Any] = {"status": status}
        if progress is not None:
            patch["progress"] = progress
        if error is not None:
            patch["error"] = error
        rows = await self.supabase.update("jobs", {"id": job_id}, patch)
        return rows[0] if rows else {}

    async def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        return await self.supabase.select_one("jobs", {"id": job_id})

    async def list(self, user_id: str, limit: int = 20, offset: int = 0, status: Optional[str] = None) -> List[Dict[str, Any]]:
        params: Dict[str, Any] = {"user_id.eq": user_id, "limit": limit, "offset": offset, "order": "created_at.desc"}
        if status:
            params["status.eq"] = status
        return await self.supabase.select("jobs", params)
