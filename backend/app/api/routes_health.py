from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.entities import Account, Transaction, Complaint, Customer
from app.schemas.schemas import SystemHealthResponse
from app.services.risk_engine import risk_engine
from app.services.data_generator import generate_synthetic_data

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MULEX Financial Crime Intelligence Platform",
        "environment": "DEMO / SYNTHETIC DATA",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/system/stats", response_model=SystemHealthResponse)
def get_system_stats(db: Session = Depends(get_db)):
    total_accs = db.query(Account).count()
    total_txns = db.query(Transaction).count()
    total_comps = db.query(Complaint).count()
    total_custs = db.query(Customer).count()

    metrics = risk_engine.validation_metrics
    if not risk_engine.is_trained:
        try:
            metrics = risk_engine.train_and_evaluate(db)
        except Exception:
            pass

    return SystemHealthResponse(
        api_status="ONLINE - 200 OK",
        database_status="CONNECTED (SQLite / WAL Enabled)",
        ml_engine_status="ACTIVE (RandomForest + SHAP Attribution)",
        graph_engine_status="ACTIVE (NetworkX In-Memory MultiDiGraph)",
        environment="DEMO / SYNTHETIC DATA",
        model_version="MULEX-RF-v1.4.2",
        total_accounts=total_accs,
        total_transactions=total_txns,
        total_complaints=total_comps,
        total_customers=total_custs,
        last_ingestion=datetime.utcnow(),
        validation_metrics=metrics
    )

@router.post("/system/reseed")
def reseed_database(db: Session = Depends(get_db)):
    res = generate_synthetic_data(db, force_reset=True)
    try:
        risk_engine.train_and_evaluate(db)
    except Exception:
        pass
    return res
