"""
Download pretrained deepfake detection weights from HuggingFace.

Usage:
    python scripts/download_weights.py

Downloads into ./models/ (created automatically).
Total size: ~400 MB for EfficientNet-B7 + XceptionNet combined.
"""

import os
import sys
import hashlib
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Model registry — HuggingFace repos with FaceForensics++ fine-tuned weights
# ---------------------------------------------------------------------------
MODELS = [
    {
        "name":     "EfficientNet-B7 (FaceForensics++)",
        "repo":     "DeepFakeDetection/efficientnet-b7-faceforensics",
        "filename": "efficientnet_b7_deepfake.pth",
        "size_mb":  254,
        # SHA256 of the file — verified after download
        "sha256":   None,   # set after first run; leave None to skip check
    },
    {
        "name":     "XceptionNet (FaceForensics++)",
        "repo":     "DeepFakeDetection/xceptionnet-faceforensics",
        "filename": "xception_deepfake.pth",
        "size_mb":  86,
        "sha256":   None,
    },
]

# ---------------------------------------------------------------------------
# Fallback: if the HuggingFace repos above are private or unavailable,
# we download the timm ImageNet checkpoint and note that fine-tuning is needed.
# These are always public and work out of the box (lower accuracy).
# ---------------------------------------------------------------------------
FALLBACK_MODELS = [
    {
        "name":     "EfficientNet-B7 (ImageNet — needs fine-tuning)",
        "timm_name": "efficientnet_b7",
        "filename": "efficientnet_b7_deepfake.pth",
    },
    {
        "name":     "XceptionNet (ImageNet — needs fine-tuning)",
        "timm_name": "xception",
        "filename": "xception_deepfake.pth",
    },
]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def download_from_huggingface(model: dict) -> bool:
    """Try downloading from HuggingFace hub. Returns True on success."""
    try:
        from huggingface_hub import hf_hub_download
        print(f"\n📥 Downloading {model['name']} (~{model['size_mb']} MB)...")
        path = hf_hub_download(
            repo_id=model["repo"],
            filename=model["filename"],
            local_dir=str(MODELS_DIR),
        )
        dest = MODELS_DIR / model["filename"]
        if Path(path) != dest:
            import shutil
            shutil.move(path, dest)

        if model["sha256"]:
            actual = sha256_file(dest)
            if actual != model["sha256"]:
                print(f"  ❌ SHA256 mismatch! Expected {model['sha256']}, got {actual}")
                dest.unlink()
                return False

        size_mb = dest.stat().st_size / (1024 * 1024)
        print(f"  ✅ Saved to {dest}  ({size_mb:.1f} MB)")
        return True

    except Exception as e:
        print(f"  ⚠️  HuggingFace download failed: {e}")
        return False


def download_timm_fallback(model: dict):
    """Download ImageNet pretrained weights via timm as fallback."""
    try:
        import timm
        import torch
        print(f"\n📥 Downloading {model['name']} via timm (ImageNet pretrained)...")
        m = timm.create_model(model["timm_name"], pretrained=True, num_classes=2)
        dest = MODELS_DIR / model["filename"]
        torch.save({"model_state_dict": m.state_dict(), "num_classes": 2, "source": "imagenet"}, dest)
        size_mb = dest.stat().st_size / (1024 * 1024)
        print(f"  ✅ Saved to {dest}  ({size_mb:.1f} MB)")
        print(f"  ⚠️  NOTE: These are ImageNet weights, NOT fine-tuned on deepfake data.")
        print(f"       Accuracy will be lower. See README for fine-tuning instructions.")
    except Exception as e:
        print(f"  ❌ Fallback also failed: {e}")
        print(f"     Try: pip install timm torch")


def main():
    print("=" * 60)
    print("  DeepScan — Model Weight Downloader")
    print("=" * 60)
    print(f"  Target directory: {MODELS_DIR.resolve()}")

    for model, fallback in zip(MODELS, FALLBACK_MODELS):
        dest = MODELS_DIR / model["filename"]

        if dest.exists():
            size_mb = dest.stat().st_size / (1024 * 1024)
            print(f"\n✅ {model['name']} already exists ({size_mb:.1f} MB) — skipping")
            continue

        # Try HuggingFace first, fall back to timm
        success = download_from_huggingface(model)
        if not success:
            print(f"  → Falling back to ImageNet pretrained weights...")
            download_timm_fallback(fallback)

    print("\n" + "=" * 60)
    print("  Download complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Set USE_MOCK_MODEL=false in your .env file")
    print("  2. Restart the backend: python run.py")
    print("  3. Check /health — model_ready should be true")
    print()

    # Verify all weights present
    missing = [m["filename"] for m in MODELS if not (MODELS_DIR / m["filename"]).exists()]
    if missing:
        print(f"⚠️  Missing weights: {missing}")
        print("   The backend will fall back to mock mode for missing models.")
    else:
        print("✅ All weights present. Set USE_MOCK_MODEL=false to activate real detection.")


if __name__ == "__main__":
    main()
