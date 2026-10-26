from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.entities import Alert, Account, AuditLog
from app.schemas.schemas import AlertItem, AlertStatusUpdate
from datetime import datetime

router = APIRouter()

@router.get("", response_model=List[AlertItem])
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if status:
        query = query.filter(Alert.status == status.upper())
    
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    results = []
    for al in alerts:
        acc = db.query(Account).filter(Account.account_id == al.account_id).first()
        results.append(AlertItem(
            alert_id=al.alert_id,
            alert_type=al.alert_type,
            account_id=al.account_id,
            account_number=acc.account_number if acc else al.account_id,
            severity=al.severity,
            reason=al.reason,
            status=al.status,
            created_at=al.created_at
        ))
    return results

@router.post("/{alert_id}/status", response_model=AlertItem)
def update_alert_status(alert_id: str, data: AlertStatusUpdate, db: Session = Depends(get_db)):
    al = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not al:
        raise HTTPException(status_code=404, detail="Alert not found")

    al.status = data.status.upper()
    db.add(AuditLog(
        log_id=f"LOG-{alert_id[-6:]}",
        entity_type="ALERT",
        entity_id=alert_id,
        action=f"STATUS_UPDATED_TO_{al.status}",
        investigator="Investigator",
        details=f"Alert {alert_id} status updated to {al.status}",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    db.refresh(al)

    acc = db.query(Account).filter(Account.account_id == al.account_id).first()
    return AlertItem(
        alert_id=al.alert_id,
        alert_type=al.alert_type,
        account_id=al.account_id,
        account_number=acc.account_number if acc else al.account_id,
        severity=al.severity,
        reason=al.reason,
        status=al.status,
        created_at=al.created_at
    )
