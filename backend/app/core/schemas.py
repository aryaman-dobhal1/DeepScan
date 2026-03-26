from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class FileType(str, Enum):
    image = "image"
    video = "video"
    audio = "audio"


class Verdict(str, Enum):
    DEEPFAKE  = "DEEPFAKE"
    SUSPECT   = "SUSPECT"
    AUTHENTIC = "AUTHENTIC"


class Confidence(str, Enum):
    HIGH   = "HIGH"
    MEDIUM = "MEDIUM"
    LOW    = "LOW"


# ---------------------------------------------------------------------------
# Signal score breakdown
# ---------------------------------------------------------------------------
class SignalScores(BaseModel):
    gan_artifact:      float = Field(..., ge=0, le=100, description="GAN checkerboard artifact score")
    facial_inconsistency: float = Field(..., ge=0, le=100, description="Facial landmark inconsistency")
    blink_anomaly:     float = Field(..., ge=0, le=100, description="Unnatural blink pattern score")
    skin_texture:      float = Field(..., ge=0, le=100, description="Skin texture coherence (lower = suspect)")
    frequency_shift:   float = Field(..., ge=0, le=100, description="Frequency domain shift score")
    metadata_auth:     float = Field(..., ge=0, le=100, description="Metadata authenticity score")


# ---------------------------------------------------------------------------
# Metadata forensic finding
# ---------------------------------------------------------------------------
class MetadataFinding(BaseModel):
    field:    str
    value:    str
    status:   str   # VALID | SUSPICIOUS | FLAGGED | ANOMALY
    severity: str   # OK | WARN | DANGER


# ---------------------------------------------------------------------------
# Frame data entry (for videos)
# ---------------------------------------------------------------------------
class FrameData(BaseModel):
    frame:  int
    time_s: float
    score:  float
    type:   str   # clean | suspect | fake


# ---------------------------------------------------------------------------
# Scan request schemas
# ---------------------------------------------------------------------------
class URLScanRequest(BaseModel):
    url: str
    model: Optional[str] = "efficientnet"
    sensitivity: Optional[float] = 72.0


# ---------------------------------------------------------------------------
# Scan response
# ---------------------------------------------------------------------------
class ScanResponse(BaseModel):
    id:               str
    filename:         str
    file_type:        FileType
    file_size_kb:     Optional[float]
    fake_probability: float
    verdict:          Verdict
    confidence:       Confidence
    signals:          SignalScores
    metadata_findings: List[MetadataFinding]
    frame_data:       Optional[List[FrameData]] = None
    model_used:       str
    analysis_time_ms: int
    summary:          str
    created_at:       datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# History list item (lighter than full ScanResponse)
# ---------------------------------------------------------------------------
class ScanListItem(BaseModel):
    id:               str
    filename:         str
    file_type:        FileType
    file_size_kb:     Optional[float]
    fake_probability: float
    verdict:          Verdict
    model_used:       str
    created_at:       datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Stats response
# ---------------------------------------------------------------------------
class StatsResponse(BaseModel):
    total_scans:       int
    deepfakes_found:   int
    authentics_found:  int
    suspects_found:    int
    detection_rate_pct: float
    avg_analysis_ms:   float


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status:     str
    version:    str
    model_ready: bool
    db_ok:      bool


# ---------------------------------------------------------------------------
# Extended scan response with real-model extras
# ---------------------------------------------------------------------------
class ManipulationRegion(BaseModel):
    x:         int
    y:         int
    w:         int
    h:         int
    severity:  str   # high | medium | low
    intensity: float


class ScanResponseExtended(ScanResponse):
    """Full response when real model is active — adds heatmap and regions."""
    heatmap_b64:          Optional[str]  = None   # base64 PNG overlay
    manipulation_regions: Optional[List[ManipulationRegion]] = None
    faces_detected:       Optional[int]  = None
