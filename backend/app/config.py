import os
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "MULEX Financial Crime Intelligence & Investigation Platform"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "DEMO / SYNTHETIC DATA"
    VERSION: str = "1.0.0"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR.parent / "data"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR.parent / 'data' / 'mulex.db'}"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*"
    ]
    
    # Synthetic generation scale
    SYNTHETIC_ACCOUNTS_COUNT: int = 2500
    SYNTHETIC_TRANSACTIONS_COUNT: int = 15000
    SYNTHETIC_CUSTOMERS_COUNT: int = 1500
    SYNTHETIC_COMPLAINTS_COUNT: int = 400

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
