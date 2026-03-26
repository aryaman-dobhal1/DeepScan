"""
GET /api/export/csv          — export full scan history as CSV
GET /api/export/pdf/{id}     — export single scan as PDF report
GET /api/export/pdf/batch    — export multiple scans as one PDF (POST with ids)
"""

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.scan import ScanRecord

router = APIRouter(prefix="/export", tags=["export"])


# ---------------------------------------------------------------------------
# GET /api/export/csv
# ---------------------------------------------------------------------------
@router.get("/csv", summary="Export full scan history as CSV")
async def export_csv(db: AsyncSession = Depends(get_db)):
    stmt    = select(ScanRecord).order_by(desc(ScanRecord.created_at))
    result  = await db.execute(stmt)
    records = result.scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)

    # Header
    writer.writerow([
        "ID", "Filename", "File Type", "File Size (KB)",
        "Fake Probability (%)", "Verdict", "Confidence",
        "GAN Artifact", "Facial Inconsistency", "Blink Anomaly",
        "Skin Texture", "Frequency Shift", "Metadata Auth",
        "Model Used", "Analysis Time (ms)", "Created At",
    ])

    for r in records:
        sig = r.signals or {}
        writer.writerow([
            r.id, r.filename, r.file_type, r.file_size_kb or "",
            r.fake_probability, r.verdict, r.confidence,
            sig.get("gan_artifact", ""),
            sig.get("facial_inconsistency", ""),
            sig.get("blink_anomaly", ""),
            sig.get("skin_texture", ""),
            sig.get("frequency_shift", ""),
            sig.get("metadata_auth", ""),
            r.model_used,
            r.analysis_time_ms,
            r.created_at.isoformat() if r.created_at else "",
        ])

    buf.seek(0)
    filename = f"deepscan_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# GET /api/export/pdf/{scan_id}
# ---------------------------------------------------------------------------
@router.get("/pdf/{scan_id}", summary="Export a single scan as PDF report")
async def export_pdf(scan_id: str, db: AsyncSession = Depends(get_db)):
    record = await db.get(ScanRecord, scan_id)
    if not record:
        raise HTTPException(404, "Scan not found")

    from app.services.pdf_report import generate_pdf
    pdf_bytes = generate_pdf(_record_to_dict(record))

    filename = f"deepscan_report_{scan_id[:8]}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _record_to_dict(r: ScanRecord) -> dict:
    return {
        "id":                r.id,
        "filename":          r.filename,
        "file_type":         r.file_type,
        "file_size_kb":      r.file_size_kb,
        "fake_probability":  r.fake_probability,
        "verdict":           r.verdict,
        "confidence":        r.confidence,
        "signals":           r.signals or {},
        "metadata_findings": r.metadata_findings or [],
        "frame_data":        r.frame_data,
        "summary":           r.summary or "",
        "model_used":        r.model_used,
        "analysis_time_ms":  r.analysis_time_ms,
        "created_at":        r.created_at,
        "heatmap_b64":       None,   # not stored in DB (too large); omit from PDF
    }
