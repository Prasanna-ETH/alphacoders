import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.data_generator import generate_synthetic_data
from app.services.risk_engine import risk_engine

from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_accounts import router as accounts_router
from app.api.routes_money_trail import router as money_trail_router
from app.api.routes_networks import router as networks_router
from app.api.routes_complaints import router as complaints_router
from app.api.routes_investigations import router as investigations_router
from app.api.routes_reports import router as reports_router
from app.api.routes_alerts import router as alerts_router
from app.api.routes_search import router as search_router
from app.api.routes_health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mulex")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed synthetic data
    logger.info("Initializing MULEX Database and Schema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        logger.info("Verifying synthetic dataset population...")
        seed_result = generate_synthetic_data(db, force_reset=False)
        logger.info(f"Seed status: {seed_result}")

        logger.info("Initializing ML Risk Engine model fitting...")
        metrics = risk_engine.train_and_evaluate(db)
        logger.info(f"Risk model evaluation metrics: {metrics}")
    except Exception as e:
        logger.error(f"Error during startup initialization: {e}", exc_info=True)
    finally:
        db.close()

    yield
    logger.info("Shutting down MULEX backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Financial Crime Intelligence & Suspicious Mule Investigation Platform for Cybercrime Units.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(accounts_router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(money_trail_router, prefix="/api/investigations", tags=["Money Trail"])
app.include_router(networks_router, prefix="/api/networks", tags=["Networks"])
app.include_router(complaints_router, prefix="/api/complaints", tags=["Complaints"])
app.include_router(investigations_router, prefix="/api/investigations", tags=["Investigations"])
app.include_router(reports_router, prefix="/api/reports", tags=["Reports"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(search_router, prefix="/api/search", tags=["Search"])
app.include_router(health_router, prefix="/api", tags=["System Health"])

@app.get("/")
def root():
    return {
        "platform": "MULEX Financial Crime Intelligence Platform",
        "status": "OPERATIONAL",
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs"
    }
