from __future__ import annotations

from typing import Any

from aeon.services.supabase import SupabaseClient


class CreditsService:
    def __init__(self, supabase: SupabaseClient) -> None:
        self.supabase = supabase

    async def debit(self, user_id: str, amount: int, reason: str) -> int:
        out = await self.supabase.rpc("debit_credits", {"p_user_id": user_id, "p_amount": amount, "p_reason": reason})
        # rpc returns a list of objects, pick first balance_after
        if isinstance(out, list) and out:
            return int(out[0].get("balance_after", 0))
        return 0

    async def balance(self, user_id: str) -> int:
        out = await self.supabase.rpc("get_credits", {"p_user_id": user_id})
        if isinstance(out, list) and out:
            return int(out[0].get("balance", 0))
        return 0
