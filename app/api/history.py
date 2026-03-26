"""
GET /api/history          — paginated scan history
GET /api/history/stats    — aggregate statistics
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.core.schemas import ScanListItem, StatsResponse, FileType, Verdict
from app.models.scan import ScanRecord

router = APIRouter(prefix="/history", tags=["history"])


# ---------------------------------------------------------------------------
# GET /api/history
# ---------------------------------------------------------------------------
@router.get("", response_model=list[ScanListItem], summary="List all scans (paginated)")
async def list_history(
    page:    int = Query(1,   ge=1),
    limit:   int = Query(20,  ge=1, le=100),
    verdict: str = Query(None, description="Filter: DEEPFAKE | SUSPECT | AUTHENTIC"),
    ftype:   str = Query(None, description="Filter: image | video | audio"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ScanRecord).order_by(desc(ScanRecord.created_at))

    if verdict:
        stmt = stmt.where(ScanRecord.verdict == verdict.upper())
    if ftype:
        stmt = stmt.where(ScanRecord.file_type == ftype.lower())

    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    records = result.scalars().all()

    return [
        ScanListItem(
            id=r.id,
            filename=r.filename,
            file_type=FileType(r.file_type),
            file_size_kb=r.file_size_kb,
            fake_probability=r.fake_probability,
            verdict=Verdict(r.verdict),
            model_used=r.model_used,
            created_at=r.created_at,
        )
        for r in records
    ]


# ---------------------------------------------------------------------------
# GET /api/history/stats
# ---------------------------------------------------------------------------
@router.get("/stats", response_model=StatsResponse, summary="Aggregate detection statistics")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_stmt = select(func.count()).select_from(ScanRecord)
    total = (await db.execute(total_stmt)).scalar() or 0

    fakes_stmt = select(func.count()).where(ScanRecord.verdict == "DEEPFAKE")
    fakes = (await db.execute(fakes_stmt)).scalar() or 0

    suspects_stmt = select(func.count()).where(ScanRecord.verdict == "SUSPECT")
    suspects = (await db.execute(suspects_stmt)).scalar() or 0

    reals = total - fakes - suspects

    avg_ms_stmt = select(func.avg(ScanRecord.analysis_time_ms))
    avg_ms = (await db.execute(avg_ms_stmt)).scalar() or 0.0

    return StatsResponse(
        total_scans=total,
        deepfakes_found=fakes,
        authentics_found=reals,
        suspects_found=suspects,
        detection_rate_pct=round((fakes / total * 100) if total else 0, 1),
        avg_analysis_ms=round(avg_ms, 1),
    )
