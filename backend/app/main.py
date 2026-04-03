from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api import scan, history, health, export
from app.api.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()
    print("✅ Database initialised")
    yield
    print("👋 Shutting down")

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Deepfake detection API — image, video & audio analysis.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.include_router(health.router)
    app.include_router(scan.router,    prefix="/api")
    app.include_router(history.router, prefix="/api")
    app.include_router(export.router,  prefix="/api")
    app.include_router(auth_router)

    @app.get("/", include_in_schema=False)
    async def root():
        return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}

    return app

app = create_app()