"""
Grad-CAM — Gradient-weighted Class Activation Mapping.

Generates a pixel-level heatmap showing which regions of the image most
contributed to the deepfake classification. Works with any CNN backbone.

Usage:
    cam = GradCAM(model, target_layer=model.features[-1])
    heatmap = cam.generate(input_tensor)   # numpy array H×W, values 0–255
    overlay = cam.overlay(pil_image, heatmap)
"""

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from typing import Optional


class GradCAM:
    """
    Hooks into the target layer's forward and backward passes to extract
    gradients and activations, then combines them into a saliency map.
    """

    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.target_layer = target_layer
        self._activations: Optional[torch.Tensor] = None
        self._gradients:   Optional[torch.Tensor] = None
        self._handles = []
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self._activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self._gradients = grad_output[0].detach()

        self._handles.append(self.target_layer.register_forward_hook(forward_hook))
        self._handles.append(self.target_layer.register_full_backward_hook(backward_hook))

    def remove_hooks(self):
        for h in self._handles:
            h.remove()
        self._handles.clear()

    def generate(
        self,
        input_tensor: torch.Tensor,   # shape: (1, 3, H, W), already on device
        target_class: int = 1,        # 1 = fake class
    ) -> np.ndarray:
        """
        Returns a float32 numpy array of shape (H, W) with values 0–255.
        H and W match the spatial size of the input tensor.
        """
        self.model.eval()
        # Ensure gradients are tracked for the input
        input_tensor = input_tensor.requires_grad_(True)

        # Forward pass
        output = self.model(input_tensor)

        # Backward pass for the target class
        self.model.zero_grad()
        one_hot = torch.zeros_like(output)
        one_hot[0][target_class] = 1.0
        output.backward(gradient=one_hot, retain_graph=True)

        # Pool gradients across spatial dimensions → channel weights
        weights = self._gradients.mean(dim=(2, 3), keepdim=True)  # (1, C, 1, 1)

        # Weighted sum of activation maps
        cam = (weights * self._activations).sum(dim=1, keepdim=True)  # (1, 1, h, w)
        cam = F.relu(cam)

        # Upsample to input resolution
        h, w = input_tensor.shape[2], input_tensor.shape[3]
        cam = F.interpolate(cam, size=(h, w), mode="bilinear", align_corners=False)

        # Normalise to 0–255
        cam = cam.squeeze().cpu().numpy()
        cam -= cam.min()
        if cam.max() > 0:
            cam /= cam.max()
        cam = (cam * 255).astype(np.uint8)
        return cam

    def overlay(
        self,
        pil_image: Image.Image,
        heatmap: np.ndarray,
        alpha: float = 0.45,
        colormap: str = "jet",
    ) -> Image.Image:
        """
        Blends the heatmap onto the original image.
        Returns a PIL Image with the Grad-CAM overlay.
        """
        import cv2

        # Resize heatmap to match image
        img_w, img_h = pil_image.size
        cam_resized = np.array(Image.fromarray(heatmap).resize((img_w, img_h), Image.BILINEAR))

        # Apply colormap
        cmap = getattr(cv2, f"COLORMAP_{colormap.upper()}", cv2.COLORMAP_JET)
        colored = cv2.applyColorMap(cam_resized, cmap)           # BGR
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)   # RGB

        # Blend
        base = np.array(pil_image.convert("RGB"), dtype=np.float32)
        overlay = colored_rgb.astype(np.float32)
        blended = (1 - alpha) * base + alpha * overlay
        blended = np.clip(blended, 0, 255).astype(np.uint8)
        return Image.fromarray(blended)

    def heatmap_to_regions(self, heatmap: np.ndarray, threshold: float = 0.5) -> list[dict]:
        """
        Converts a raw heatmap into a list of bounding-box regions with severity labels.
        Used by the API to return structured manipulation regions to the frontend.

        Returns:
            list of { x, y, w, h, severity: 'high'|'medium'|'low', intensity: float }
        """
        import cv2

        norm = heatmap.astype(np.float32) / 255.0
        binary = (norm >= threshold).astype(np.uint8) * 255

        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        regions = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if w * h < 100:   # skip tiny blobs
                continue
            roi_intensity = float(norm[y:y+h, x:x+w].mean())
            severity = "high" if roi_intensity >= 0.75 else "medium" if roi_intensity >= 0.55 else "low"
            regions.append({
                "x": int(x), "y": int(y),
                "w": int(w), "h": int(h),
                "severity": severity,
                "intensity": round(roi_intensity, 3),
            })

        # Sort highest intensity first
        return sorted(regions, key=lambda r: r["intensity"], reverse=True)


def heatmap_to_base64(pil_image: Image.Image) -> str:
    """Encode a PIL heatmap overlay image as a base64 PNG string for API responses."""
    import io, base64
    buf = io.BytesIO()
    pil_image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()
