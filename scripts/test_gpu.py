"""
Verify GPU + ViT model load correctly before starting the server.
Run: python scripts/test_gpu.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

def check_cuda():
    import torch
    print(f"PyTorch  : {torch.__version__}")
    print(f"CUDA     : {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU      : {torch.cuda.get_device_name(0)}")
        total = torch.cuda.get_device_properties(0).total_memory / 1e9
        free  = total - torch.cuda.memory_allocated() / 1e9
        print(f"VRAM     : {total:.1f} GB total, {free:.1f} GB free")
    return torch.cuda.is_available()

def check_vit():
    print("  Loading Wvolf/ViT_Deepfake_Detection ...")
    from transformers import AutoImageProcessor, AutoModelForImageClassification
    from PIL import Image
    import torch, numpy as np
    proc  = AutoImageProcessor.from_pretrained("Wvolf/ViT_Deepfake_Detection")
    model = AutoModelForImageClassification.from_pretrained("Wvolf/ViT_Deepfake_Detection")
    model.eval()
    img   = Image.fromarray(np.random.randint(0,255,(224,224,3),dtype=np.uint8))
    inputs = proc(images=img, return_tensors="pt")
    with torch.no_grad():
        logits = model(**inputs).logits
    probs = torch.softmax(logits, dim=1)[0].tolist()
    print(f"  Labels   : {model.config.id2label}")
    print(f"  Test probs: {[round(p,3) for p in probs]}")
    print(f"  ✅ ViT forward pass OK")

def check_mtcnn():
    from facenet_pytorch import MTCNN
    from PIL import Image
    import numpy as np
    mtcnn = MTCNN(keep_all=True, device="cpu")
    img   = Image.fromarray(np.random.randint(0,255,(300,300,3),dtype=np.uint8))
    boxes, _ = mtcnn.detect(img)
    print(f"  ✅ MTCNN OK  ({0 if boxes is None else len(boxes)} faces in random image)")

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  DeepScan — GPU & Model Check")
    print("="*55)
    print("\n[CUDA]")
    check_cuda()
    print("\n[ViT Model]")
    try: check_vit()
    except Exception as e: print(f"  ❌ {e}")
    print("\n[MTCNN]")
    try: check_mtcnn()
    except Exception as e: print(f"  ❌ {e}")
    print("\n" + "="*55)
    print("  If all checks passed → python run.py")
    print("="*55 + "\n")
