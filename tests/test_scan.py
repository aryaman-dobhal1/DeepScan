"""
Run with: pytest tests/ -v
"""
import pytest
import io
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("ok", "degraded")
    assert data["model_ready"] is True


@pytest.mark.asyncio
async def test_scan_upload_image():
    # Create a minimal 1x1 white JPEG in memory
    from PIL import Image
    img = Image.new("RGB", (100, 100), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/scan/upload",
            files={"file": ("test_photo.jpg", buf, "image/jpeg")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "fake_probability" in data
    assert 0 <= data["fake_probability"] <= 100
    assert data["verdict"] in ("DEEPFAKE", "SUSPECT", "AUTHENTIC")
    assert "signals" in data
    assert "metadata_findings" in data


@pytest.mark.asyncio
async def test_history_empty_returns_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/history")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_stats_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/history/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_scans" in data
    assert "deepfakes_found" in data


@pytest.mark.asyncio
async def test_scan_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/scan/nonexistent-id")
    assert resp.status_code == 404
