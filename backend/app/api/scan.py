"""
POST /api/scan/upload   — upload a file and scan it
POST /api/scan/url      — scan a media file from a URL
GET  /api/scan/{id}     — retrieve a single scan result
DELETE /api/scan/{id}   — delete a scan record
"""

import uuid
import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.schemas import ScanResponse, URLScanRequest
from app.models.scan import ScanRecord
from app.services.detector import detector

router = APIRouter(prefix="/scan", tags=["scan"])

MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


# ---------------------------------------------------------------------------
# POST /api/scan/upload
# ---------------------------------------------------------------------------
@router.post("/upload", response_model=ScanResponse, summary="Upload and scan a file")
async def scan_upload(
    file: UploadFile = File(..., description="Image, video or audio file to analyse"),
    model: str = Query("efficientnet", description="Model to use: efficientnet | xception | ensemble | mesonet"),
    db: AsyncSession = Depends(get_db),
):
    # Size guard
    file_bytes = await file.read()
    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(413, f"File too large. Max {settings.MAX_FILE_SIZE_MB} MB.")

    # Run detection
    result = await detector.scan_file(
        filename=file.filename,
        file_bytes=file_bytes,
        content_type=file.content_type,
        model_override=model,
    )

    # Persist
    record = ScanRecord(
        id=str(uuid.uuid4()),
        filename=file.filename,
        source="upload",
        model_used=model,
        **_flatten_result(result),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return _to_response(record, result)


# ---------------------------------------------------------------------------
# POST /api/scan/url
# ---------------------------------------------------------------------------
@router.post("/url", response_model=ScanResponse, summary="Scan media from a URL")
async def scan_url(
    body: URLScanRequest,
    db: AsyncSession = Depends(get_db),
):
    # Download the file
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(str(body.url), follow_redirects=True)
            resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(400, f"Could not fetch URL: {e}")

    file_bytes = resp.content
    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(413, f"Remote file too large. Max {settings.MAX_FILE_SIZE_MB} MB.")

    content_type = resp.headers.get("content-type", "")
    filename = str(body.url).split("/")[-1].split("?")[0] or "remote_file"

    result = await detector.scan_file(
        filename=filename,
        file_bytes=file_bytes,
        content_type=content_type,
        model_override=body.model,
    )

    record = ScanRecord(
        id=str(uuid.uuid4()),
        filename=filename,
        source="url",
        model_used=body.model or "efficientnet",
        **_flatten_result(result),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return _to_response(record, result)


# ---------------------------------------------------------------------------
# GET /api/scan/{id}
# ---------------------------------------------------------------------------
@router.get("/{scan_id}", response_model=ScanResponse, summary="Get a scan result by ID")
async def get_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    record = await db.get(ScanRecord, scan_id)
    if not record:
        raise HTTPException(404, "Scan not found")
    return _to_response(record, _unpack_record(record))


# ---------------------------------------------------------------------------
# DELETE /api/scan/{id}
# ---------------------------------------------------------------------------
@router.delete("/{scan_id}", summary="Delete a scan record")
async def delete_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    record = await db.get(ScanRecord, scan_id)
    if not record:
        raise HTTPException(404, "Scan not found")
    await db.delete(record)
    await db.commit()
    return JSONResponse({"deleted": scan_id})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _flatten_result(result: dict) -> dict:
    """Convert nested result dict into flat DB column values."""
    signals = result["signals"]
    return {
        "file_type":        result["file_type"].value,
        "file_size_kb":     result.get("file_size_kb"),
        "fake_probability": result["fake_probability"],
        "verdict":          result["verdict"].value,
        "confidence":       result["confidence"].value,
        "signals":          signals.model_dump(),
        "metadata_findings": [f.model_dump() for f in result["metadata_findings"]],
        "frame_data":        [f.model_dump() for f in result["frame_data"]] if result.get("frame_data") else None,
        "analysis_time_ms": result["analysis_time_ms"],
        "summary":          result["summary"],
    }


def _unpack_record(record: ScanRecord) -> dict:
    """Re-hydrate a DB record into the result shape."""
    from app.core.schemas import SignalScores, MetadataFinding, FrameData
    return {
        "file_type":        record.file_type,
        "file_size_kb":     record.file_size_kb,
        "fake_probability": record.fake_probability,
        "verdict":          record.verdict,
        "confidence":       record.confidence,
        "signals":          SignalScores(**record.signals),
        "metadata_findings": [MetadataFinding(**f) for f in (record.metadata_findings or [])],
        "frame_data":        [FrameData(**f) for f in (record.frame_data or [])] if record.frame_data else None,
        "analysis_time_ms": record.analysis_time_ms,
        "summary":          record.summary,
    }


def _to_response(record: ScanRecord, result: dict) -> ScanResponse:
    from app.core.schemas import ScanResponse, SignalScores, MetadataFinding, FrameData, FileType, Verdict, Confidence
    signals = result["signals"]
    if isinstance(signals, dict):
        signals = SignalScores(**signals)

    return ScanResponse(
        id=record.id,
        filename=record.filename,
        file_type=FileType(record.file_type),
        file_size_kb=record.file_size_kb,
        fake_probability=record.fake_probability,
        verdict=Verdict(record.verdict),
        confidence=Confidence(record.confidence),
        signals=signals,
        metadata_findings=[
            MetadataFinding(**f) if isinstance(f, dict) else f
            for f in (result.get("metadata_findings") or [])
        ],
        frame_data=[
            FrameData(**f) if isinstance(f, dict) else f
            for f in (result.get("frame_data") or [])
        ] if result.get("frame_data") else None,
        model_used=record.model_used,
        analysis_time_ms=record.analysis_time_ms,
        summary=record.summary,
        created_at=record.created_at,
    )
