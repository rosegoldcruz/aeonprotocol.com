from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime, timedelta

from ..database.neon_db import get_db, Job, JobStatus, JobType

router = APIRouter()


class DashboardMetrics(BaseModel):
    timestamp: str
    totals: dict
    by_type: dict
    last_24h: dict
    latency_ms: dict
    cost_total_cents: int


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


@router.get("/v1/metrics/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    # Totals by status
    totals = {}
    for st in JobStatus:
        res = await db.execute(select(func.count()).where(Job.status == st))
        totals[st.value] = int(res.scalar() or 0)

    # By type counts
    by_type = {}
    for jt in JobType:
        res = await db.execute(select(func.count()).where(Job.type == jt))
        by_type[jt.value] = int(res.scalar() or 0)

    # Last 24h counts
    since = datetime.utcnow() - timedelta(hours=24)
    res24_total = await db.execute(select(func.count()).where(Job.created_at >= since))
    res24_completed = await db.execute(
        select(func.count()).where(Job.status == JobStatus.COMPLETED, Job.completed_at >= since)
    )
    last_24h = {
        "created": int(res24_total.scalar() or 0),
        "completed": int(res24_completed.scalar() or 0),
    }

    # Latency (avg/50p/95p) for completed jobs
    latencies = []
    res = await db.execute(select(Job.created_at, Job.completed_at).where(Job.status == JobStatus.COMPLETED))
    for created_at, completed_at in res.all():
        if created_at and completed_at:
            latencies.append((completed_at - created_at).total_seconds() * 1000.0)
    latency_ms = {"avg": 0, "p50": 0, "p95": 0}
    if latencies:
        latencies.sort()
        n = len(latencies)
        latency_ms["avg"] = int(sum(latencies) / n)
        latency_ms["p50"] = int(latencies[int(0.5 * (n - 1))])
        latency_ms["p95"] = int(latencies[int(0.95 * (n - 1))])

    # Cost: not tracked yet; keep explicit as 0 to avoid placeholders
    cost_total_cents = 0

    return DashboardMetrics(
        timestamp=_now_iso(),
        totals=totals,
        by_type=by_type,
        last_24h=last_24h,
        latency_ms=latency_ms,
        cost_total_cents=cost_total_cents,
    )

