# DeepScan — Backend API (Step 2)

FastAPI backend with async SQLite, mock ML detection engine, and full REST API.

## Project Structure
```
deepscan-backend/
├── app/
│   ├── api/
│   │   ├── scan.py        ← POST /api/scan/upload, /url  |  GET /api/scan/{id}
│   │   ├── history.py     ← GET /api/history, /history/stats
│   │   └── health.py      ← GET /health
│   ├── core/
│   │   ├── config.py      ← Settings (reads .env)
│   │   ├── database.py    ← Async SQLite via SQLAlchemy
│   │   └── schemas.py     ← Pydantic request/response models
│   ├── models/
│   │   └── scan.py        ← ScanRecord ORM model
│   ├── services/
│   │   ├── detector.py    ← Main detection service (dispatches mock/real)
│   │   └── mock_model.py  ← Deterministic mock that mimics real model output
│   └── main.py            ← FastAPI app factory + CORS + routing
├── tests/
│   └── test_scan.py
├── run.py                 ← Dev server entrypoint
├── requirements.txt
├── railway.json           ← Railway deploy config
├── nixpacks.toml          ← Build config for Railway
└── Procfile
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scan/upload` | Upload file and scan |
| `POST` | `/api/scan/url` | Scan from URL |
| `GET`  | `/api/scan/{id}` | Get scan result by ID |
| `DELETE` | `/api/scan/{id}` | Delete a scan |
| `GET`  | `/api/history` | Paginated scan history |
| `GET`  | `/api/history/stats` | Aggregate statistics |
| `GET`  | `/health` | Health check |

Interactive docs: `http://localhost:8000/docs`

## Quick Start

```bash
cd deepscan-backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env file
cp .env.example .env

# 4. Run dev server
python run.py
# → API running at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

## Environment Variables

```env
HOST=0.0.0.0
PORT=8000
DEBUG=true
DATABASE_URL=sqlite+aiosqlite:///./deepscan.db
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
USE_MOCK_MODEL=true        # Set false after adding real weights (Step 3)
MODEL_DIR=./models
MAX_FILE_SIZE_MB=100
```

## Run Tests

```bash
pip install pytest pytest-asyncio httpx pillow
pytest tests/ -v
```

## Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set env vars in Railway dashboard:
# ALLOWED_ORIGINS = https://your-app.vercel.app
# USE_MOCK_MODEL  = true
# DEBUG           = false
```

## Build Roadmap
- [x] Step 1 — Frontend UI
- [x] Step 2 — FastAPI Backend (this)
- [ ] Step 3 — Real ML model (EfficientNet-B7 weights + PyTorch inference)
- [ ] Step 4 — SQLite → PostgreSQL for production
- [ ] Step 5 — Full integration test
- [ ] Step 6 — Deploy both services
- [ ] Step 7 — Polish + docs
