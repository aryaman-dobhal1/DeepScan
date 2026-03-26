"""
Detection service dispatcher.
USE_MOCK_MODEL=true  → fast deterministic mock (for dev/testing)
USE_MOCK_MODEL=false → real Wvolf/ViT_Deepfake_Detection model
"""

import mimetypes
from typing import Optional
from app.core.config import settings
from app.core.schemas import FileType, Verdict, Confidence, SignalScores


def _file_type(filename: str, content_type: Optional[str] = None) -> FileType:
    mime = content_type or mimetypes.guess_type(filename)[0] or ""
    if mime.startswith("video") or filename.lower().split(".")[-1] in ["mp4","mov","avi","mkv","webm"]:
        return FileType.video
    if mime.startswith("audio") or filename.lower().split(".")[-1] in ["mp3","wav","aac","flac","ogg"]:
        return FileType.audio
    return FileType.image


def _verdict(prob: float) -> tuple[Verdict, Confidence]:
    if prob >= 70:
        return Verdict.DEEPFAKE, (Confidence.HIGH if prob >= 85 else Confidence.MEDIUM)
    if prob >= 40:
        return Verdict.SUSPECT, Confidence.MEDIUM
    return Verdict.AUTHENTIC, (Confidence.HIGH if prob <= 15 else Confidence.MEDIUM)


class DetectionService:

    def __init__(self):
        self.model_ready = False
        self._real = None

        if settings.USE_MOCK_MODEL:
            print("⚡ Mock mode active (USE_MOCK_MODEL=true)")
            self.model_ready = True
        else:
            try:
                from app.services.real_model import RealDetector
                self._real = RealDetector()
                self.model_ready = self._real.model_ready
                print("✅ Real model loaded (Wvolf/ViT_Deepfake_Detection)")
            except Exception as e:
                print(f"⚠️  Real model failed ({e}) — falling back to mock")
                self.model_ready = True

    async def scan_file(
        self,
        filename: str,
        file_bytes: bytes,
        content_type: Optional[str] = None,
        model_override: Optional[str] = None,
    ) -> dict:
        file_type    = _file_type(filename, content_type)
        file_size_kb = round(len(file_bytes) / 1024, 1)

        if settings.USE_MOCK_MODEL or self._real is None:
            from app.services import mock_model
            if file_type == FileType.video:
                result = mock_model.analyze_video(filename, file_bytes)
            elif file_type == FileType.audio:
                result = mock_model.analyze_audio(filename, file_bytes)
            else:
                result = mock_model.analyze_image(filename, file_bytes)
            model_name = "mock-vit"
        else:
            result     = await self._real.analyze(filename, file_bytes, file_type)
            model_name = "Wvolf/ViT_Deepfake_Detection"

        verdict, confidence = _verdict(result["fake_probability"])

        return {
            "file_type":            file_type,
            "file_size_kb":         file_size_kb,
            "fake_probability":     result["fake_probability"],
            "verdict":              verdict,
            "confidence":           confidence,
            "signals":              result["signals"],
            "metadata_findings":    result["metadata_findings"],
            "frame_data":           result.get("frame_data"),
            "heatmap_b64":          result.get("heatmap_b64"),
            "manipulation_regions": result.get("manipulation_regions"),
            "faces_detected":       result.get("faces_detected"),
            "model_used":           model_override or model_name,
            "analysis_time_ms":     result["analysis_time_ms"],
            "summary":              result["summary"],
        }


detector = DetectionService()
