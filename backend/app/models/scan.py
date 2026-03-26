from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text, Boolean
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


def new_uuid() -> str:
    return str(uuid.uuid4())


class ScanRecord(Base):
    """Stores every scan result persistently."""
    __tablename__ = "scan_records"

    id             = Column(String, primary_key=True, default=new_uuid)
    filename       = Column(String, nullable=False)
    file_type      = Column(String, nullable=False)        # image | video | audio
    file_size_kb   = Column(Float, nullable=True)
    source         = Column(String, default="upload")      # upload | url | webcam

    # Core verdict
    fake_probability   = Column(Float, nullable=False)     # 0.0 – 100.0
    verdict            = Column(String, nullable=False)    # DEEPFAKE | SUSPECT | AUTHENTIC
    confidence         = Column(String, default="HIGH")    # HIGH | MEDIUM | LOW

    # Per-signal scores (stored as JSON)
    signals            = Column(JSON, nullable=True)

    # Metadata findings (stored as JSON list)
    metadata_findings  = Column(JSON, nullable=True)

    # Model used
    model_used         = Column(String, default="efficientnet")
    analysis_time_ms   = Column(Integer, nullable=True)

    # Frame-level data for video (JSON list of {frame, score, type})
    frame_data         = Column(JSON, nullable=True)

    # Extra notes / report text
    summary            = Column(Text, nullable=True)

    # Timestamps
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    def verdict_from_score(self):
        if self.fake_probability >= 70:
            return "DEEPFAKE"
        elif self.fake_probability >= 40:
            return "SUSPECT"
        return "AUTHENTIC"
