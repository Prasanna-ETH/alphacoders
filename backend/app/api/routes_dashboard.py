from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models.entities import Account, Transaction, Complaint, NetworkCluster, Investigation, Alert
from app.schemas.schemas import DashboardSummaryResponse, AccountSummary, AlertItem

router = APIRouter()

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_accounts = db.query(Account).count()
    critical_accounts = db.query(Account).filter(Account.risk_score >= 80.0).count()
    high_risk_accounts = db.query(Account).filter(Account.risk_score >= 60.0, Account.risk_score < 80.0).count()
    active_investigations = db.query(Investigation).filter(Investigation.status != "CLOSED").count()
    
    # Total suspicious flow
    susp_flow_res = db.query(func.sum(Transaction.amount)).filter(Transaction.is_suspicious == True).scalar()
    total_suspicious_flow = float(susp_flow_res or 0.0)

    # Complaint linked accounts
    complaint_linked_count = db.query(Account).join(Complaint).distinct().count()
    detected_clusters_count = db.query(NetworkCluster).count()

    # Priority queue: Top critical accounts ordered by risk score and complaint count
    priority_accs = db.query(Account).filter(Account.risk_score >= 60.0).order_by(Account.risk_score.desc()).limit(10).all()
    priority_queue = []
    for a in priority_accs:
        inflow = sum(t.amount for t in a.received_transactions)
        outflow = sum(t.amount for t in a.sent_transactions)
        priority_queue.append(AccountSummary(
            account_id=a.account_id,
            account_number=a.account_number,
            customer_name=a.customer.name if a.customer else "Unknown",
            customer_id=a.customer_id,
            bank_name=a.bank_name,
            account_type=a.account_type,
            balance=a.balance,
            risk_score=a.risk_score,
            risk_level=a.risk_level,
            mule_type=a.mule_type,
            confidence=a.confidence,
            inflow=round(inflow, 2),
            outflow=round(outflow, 2),
            complaints_count=len(a.complaints),
            cluster_id=a.cluster_id,
            last_active_at=a.last_active_at
        ))

    # Risk distribution
    low_count = db.query(Account).filter(Account.risk_score < 30.0).count()
    medium_count = db.query(Account).filter(Account.risk_score >= 30.0, Account.risk_score < 60.0).count()
    risk_distribution = {
        "LOW": low_count,
        "MEDIUM": medium_count,
        "HIGH": high_risk_accounts,
        "CRITICAL": critical_accounts
    }

    # Fraud Category Distribution
    fraud_cats = db.query(Complaint.fraud_type, func.count(Complaint.complaint_id)).group_by(Complaint.fraud_type).all()
    fraud_category_distribution = {cat: count for cat, count in fraud_cats}

    # Suspicious Flow Trend (last 7 time buckets)
    now = datetime.utcnow()
    suspicious_flow_trend = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0)
        day_end = day_start + timedelta(days=1)
        day_vol = db.query(func.sum(Transaction.amount)).filter(
            Transaction.is_suspicious == True,
            Transaction.timestamp >= day_start,
            Transaction.timestamp < day_end
        ).scalar() or 0.0
        suspicious_flow_trend.append({
            "date": day_start.strftime("%b %d"),
            "amount": round(float(day_vol), 2),
            "flagged_count": db.query(Transaction).filter(
                Transaction.is_suspicious == True,
                Transaction.timestamp >= day_start,
                Transaction.timestamp < day_end
            ).count()
        })

    # Recent Alerts
    alerts_raw = db.query(Alert).order_by(Alert.created_at.desc()).limit(8).all()
    recent_alerts = [
        AlertItem(
            alert_id=al.alert_id,
            alert_type=al.alert_type,
            account_id=al.account_id,
            account_number=al.account.account_number if al.account else al.account_id,
            severity=al.severity,
            reason=al.reason,
            status=al.status,
            created_at=al.created_at
        )
        for al in alerts_raw
    ]

    return DashboardSummaryResponse(
        total_monitored_accounts=total_accounts,
        critical_accounts_count=critical_accounts,
        high_risk_accounts_count=high_risk_accounts,
        active_investigations_count=active_investigations,
        total_suspicious_flow=round(total_suspicious_flow, 2),
        complaint_linked_accounts_count=complaint_linked_count,
        detected_network_clusters_count=detected_clusters_count,
        priority_queue=priority_queue,
        risk_distribution=risk_distribution,
        fraud_category_distribution=fraud_category_distribution,
        suspicious_flow_trend=suspicious_flow_trend,
        recent_alerts=recent_alerts
    )
