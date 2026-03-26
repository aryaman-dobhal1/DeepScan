"""
Mock detection engine.

Used when USE_MOCK_MODEL=True (default until real weights are downloaded in Step 3).
Returns deterministic-ish but realistic scores based on file metadata so the
frontend integration can be fully tested without a GPU.
"""

import hashlib
import random
import time
from typing import Optional
from app.core.schemas import SignalScores, MetadataFinding, FrameData


def _seed_from_filename(filename: str) -> int:
    """Deterministic seed so same file always gets same score."""
    return int(hashlib.md5(filename.encode()).hexdigest()[:8], 16)


def _jitter(base: float, spread: float = 8.0, rng: random.Random = None) -> float:
    r = rng or random
    return round(max(0.0, min(100.0, base + r.uniform(-spread, spread))), 1)


def analyze_image(filename: str, file_bytes: Optional[bytes] = None) -> dict:
    rng = random.Random(_seed_from_filename(filename))
    start = time.time()

    # Pick a fake probability biased by filename keywords
    name_lower = filename.lower()
    if any(k in name_lower for k in ["fake", "deep", "swap", "gen", "ai", "synth"]):
        base_prob = rng.uniform(75, 96)
    elif any(k in name_lower for k in ["real", "authentic", "orig", "raw"]):
        base_prob = rng.uniform(4, 25)
    else:
        base_prob = rng.uniform(10, 95)

    fake_prob = round(base_prob, 1)

    # Correlate signal scores with overall fake probability
    if fake_prob >= 70:
        signals = SignalScores(
            gan_artifact=       _jitter(fake_prob + 2,  6, rng),
            facial_inconsistency=_jitter(fake_prob - 3, 8, rng),
            blink_anomaly=      _jitter(fake_prob - 25, 12, rng),
            skin_texture=       _jitter(100 - fake_prob + 10, 10, rng),
            frequency_shift=    _jitter(fake_prob - 18, 10, rng),
            metadata_auth=      _jitter(fake_prob + 1,  6, rng),
        )
        metadata = _fake_metadata_findings(rng)
    elif fake_prob >= 40:
        signals = SignalScores(
            gan_artifact=       _jitter(fake_prob,      10, rng),
            facial_inconsistency=_jitter(fake_prob - 5, 10, rng),
            blink_anomaly=      _jitter(fake_prob - 10, 12, rng),
            skin_texture=       _jitter(60,             15, rng),
            frequency_shift=    _jitter(fake_prob,      12, rng),
            metadata_auth=      _jitter(fake_prob - 5,  12, rng),
        )
        metadata = _suspect_metadata_findings(rng)
    else:
        signals = SignalScores(
            gan_artifact=        _jitter(fake_prob,         8, rng),
            facial_inconsistency=_jitter(fake_prob + 5,     8, rng),
            blink_anomaly=       _jitter(12,               10, rng),
            skin_texture=        _jitter(100 - fake_prob,  10, rng),
            frequency_shift=     _jitter(fake_prob + 3,     8, rng),
            metadata_auth=       _jitter(fake_prob + 2,     6, rng),
        )
        metadata = _real_metadata_findings(rng)

    elapsed_ms = int((time.time() - start) * 1000) + rng.randint(180, 420)

    summary = _build_summary(fake_prob, signals)

    return {
        "fake_probability": fake_prob,
        "signals": signals,
        "metadata_findings": metadata,
        "frame_data": None,
        "analysis_time_ms": elapsed_ms,
        "summary": summary,
    }


def analyze_video(filename: str, file_bytes: Optional[bytes] = None) -> dict:
    result = analyze_image(filename, file_bytes)
    result["frame_data"] = _generate_frame_data(result["fake_probability"], filename)
    result["analysis_time_ms"] += random.randint(800, 2400)
    return result


def analyze_audio(filename: str, file_bytes: Optional[bytes] = None) -> dict:
    rng = random.Random(_seed_from_filename(filename))
    start = time.time()

    base_prob = rng.uniform(5, 90)
    fake_prob = round(base_prob, 1)

    # Audio-specific signals (re-using same schema, mapped semantically)
    signals = SignalScores(
        gan_artifact=        _jitter(fake_prob,      8, rng),   # vocoder artifact
        facial_inconsistency=_jitter(fake_prob - 5, 10, rng),   # prosody mismatch
        blink_anomaly=       _jitter(fake_prob - 15,12, rng),   # breathing pattern
        skin_texture=        _jitter(100 - fake_prob, 8, rng),  # spectral coherence
        frequency_shift=     _jitter(fake_prob,      10, rng),  # mel-freq anomaly
        metadata_auth=       _jitter(fake_prob + 2,  8, rng),   # codec fingerprint
    )

    elapsed_ms = int((time.time() - start) * 1000) + rng.randint(200, 600)
    summary = _build_summary(fake_prob, signals, media="audio")

    return {
        "fake_probability": fake_prob,
        "signals": signals,
        "metadata_findings": _real_metadata_findings(rng) if fake_prob < 40 else _fake_metadata_findings(rng),
        "frame_data": None,
        "analysis_time_ms": elapsed_ms,
        "summary": summary,
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _fake_metadata_findings(rng: random.Random) -> list[MetadataFinding]:
    software_choices = [
        "Stable Diffusion WebUI 1.10.2",
        "Midjourney v6",
        "DALL-E 3 (OpenAI)",
        "DeepFaceLab 2.0",
        "FaceSwap v0.9.1",
    ]
    return [
        MetadataFinding(field="File Format",       value="JPEG / DCT",                    status="VALID",      severity="OK"),
        MetadataFinding(field="EXIF GPS Data",      value="Stripped",                      status="SUSPICIOUS", severity="WARN"),
        MetadataFinding(field="Creation Software",  value=rng.choice(software_choices),    status="FLAGGED",    severity="DANGER"),
        MetadataFinding(field="Compression Level",  value=f"Q={rng.randint(88,97)} (Unusual)", status="ANOMALY", severity="WARN"),
        MetadataFinding(field="Color Profile",      value="sRGB IEC61966",                 status="VALID",      severity="OK"),
        MetadataFinding(field="Double JPEG",        value="Detected (2x)",                 status="FLAGGED",    severity="DANGER"),
        MetadataFinding(field="Noise Fingerprint",  value="Inconsistent",                  status="FLAGGED",    severity="DANGER"),
    ]


def _suspect_metadata_findings(rng: random.Random) -> list[MetadataFinding]:
    return [
        MetadataFinding(field="File Format",       value="JPEG / DCT",          status="VALID",      severity="OK"),
        MetadataFinding(field="EXIF GPS Data",      value="Present",             status="VALID",      severity="OK"),
        MetadataFinding(field="Creation Software",  value="Adobe Photoshop",     status="SUSPICIOUS", severity="WARN"),
        MetadataFinding(field="Compression Level",  value=f"Q={rng.randint(80,92)}", status="ANOMALY", severity="WARN"),
        MetadataFinding(field="Color Profile",      value="sRGB IEC61966",       status="VALID",      severity="OK"),
        MetadataFinding(field="Double JPEG",        value="Not detected",        status="VALID",      severity="OK"),
        MetadataFinding(field="Noise Fingerprint",  value="Mildly inconsistent", status="SUSPICIOUS", severity="WARN"),
    ]


def _real_metadata_findings(rng: random.Random) -> list[MetadataFinding]:
    cameras = ["Apple iPhone 15 Pro", "Samsung Galaxy S24 Ultra", "Canon EOS R5", "Sony A7 IV"]
    return [
        MetadataFinding(field="File Format",       value="JPEG / DCT",           status="VALID", severity="OK"),
        MetadataFinding(field="EXIF GPS Data",      value="Present",              status="VALID", severity="OK"),
        MetadataFinding(field="Camera Make/Model",  value=rng.choice(cameras),   status="VALID", severity="OK"),
        MetadataFinding(field="Compression Level",  value=f"Q={rng.randint(70,85)}", status="VALID", severity="OK"),
        MetadataFinding(field="Color Profile",      value="sRGB IEC61966",        status="VALID", severity="OK"),
        MetadataFinding(field="Double JPEG",        value="Not detected",         status="VALID", severity="OK"),
        MetadataFinding(field="Noise Fingerprint",  value="Consistent (DSLR)",    status="VALID", severity="OK"),
    ]


def _generate_frame_data(fake_prob: float, filename: str) -> list[FrameData]:
    """Generate per-frame scores for video files."""
    rng = random.Random(_seed_from_filename(filename))
    frames = []
    for i in range(96):
        score = max(0.0, min(100.0,
            fake_prob + rng.uniform(-20, 20) + (10 * rng.random() if i % 7 == 0 else 0)
        ))
        ftype = "fake" if score >= 70 else "suspect" if score >= 40 else "clean"
        frames.append(FrameData(
            frame=i + 1,
            time_s=round(i * (32 / 96), 2),
            score=round(score, 1),
            type=ftype,
        ))
    return frames


def _build_summary(prob: float, signals: SignalScores, media: str = "image") -> str:
    if prob >= 70:
        return (
            f"The submitted {media} shows strong indicators of synthetic generation. "
            f"The ensemble model returned a composite fake probability of {prob:.1f}%. "
            f"GAN artifact score ({signals.gan_artifact:.0f}%) and facial inconsistency "
            f"({signals.facial_inconsistency:.0f}%) are the primary red flags. "
            f"This {media} is assessed as NOT AUTHENTIC with high confidence."
        )
    elif prob >= 40:
        return (
            f"The submitted {media} shows moderate indicators of potential manipulation. "
            f"Fake probability: {prob:.1f}%. Some signals are elevated but not conclusive. "
            f"Further manual review is recommended."
        )
    return (
        f"The submitted {media} appears authentic. "
        f"Fake probability: {prob:.1f}%. All forensic signals are within normal ranges. "
        f"No significant manipulation artifacts detected."
    )
