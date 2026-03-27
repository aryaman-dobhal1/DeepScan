from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os

class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = int(os.environ.get("PORT", 8000))
    DEBUG: bool = False
    APP_NAME: str = "DeepScan API"
    APP_VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./deepscan.db"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,https://deepscan-2px3.onrender.com"
    
    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]
    
    # ML Models
    MODEL_DIR: str = "./models"
    EFFICIENTNET_WEIGHTS: str = "./models/efficientnet_b7_deepfake.pth"
    XCEPTION_WEIGHTS: str = "./models/xception_deepfake.pth"
    USE_MOCK_MODEL: bool = True
    
    # File uploads
    MAX_FILE_SIZE_MB: int = 100
    UPLOAD_DIR: str = "./uploads"
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 30
    
    class Config:
        env_file = ".env"
        extra = "ignore"
    
    def ensure_dirs(self):
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.MODEL_DIR, exist_ok=True)

settings = Settings()
settings.ensure_dirs()