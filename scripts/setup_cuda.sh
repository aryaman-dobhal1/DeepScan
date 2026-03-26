#!/bin/bash
set -e

echo "============================================================"
echo "  DeepScan Step 3 — CUDA Setup (GTX 1650)"
echo "============================================================"

echo ""
echo "[1/4] Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo ""
echo "[2/4] Installing PyTorch with CUDA 12.1..."
pip install torch==2.5.1+cu121 torchvision==0.20.1+cu121 \
    --index-url https://download.pytorch.org/whl/cu121

echo ""
echo "[3/4] Installing remaining dependencies..."
pip install -r requirements.txt

echo ""
echo "[4/4] Downloading model weights..."
python scripts/download_weights.py

echo ""
echo "============================================================"
echo "  Setup complete! Run: python run.py"
echo "============================================================"
