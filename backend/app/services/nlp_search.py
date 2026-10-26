import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.entities import Account, Complaint, Device, NetworkCluster
from app.schemas.schemas import NLPSearchResult, AccountSummary

def parse_and_execute_nlp_query(query: str, db: Session) -> NLPSearchResult:
    q = query.lower().strip()
    applied_filters = {}
    matched_accounts = []
    intent = "GENERAL_SEARCH"

    # Pattern 1: High-risk pass-through mules
    if "pass-through" in q or "pass through" in q or ("rapid" in q and "mule" in q):
        intent = "HIGH_RISK_PASS_THROUGH_MULES"
        applied_filters = {"mule_type": "PASS-THROUGH MULE", "risk_level": "CRITICAL"}
        accs = db.query(Account).filter(
            Account.mule_type == "PASS-THROUGH MULE",
            Account.risk_score >= 60.0
        ).order_by(Account.risk_score.desc()).all()

    # Pattern 2: Accounts linked to multiple complaints
    elif "multiple complaint" in q or "complaint" in q and ("linked" in q or "multiple" in q or "more than" in q):
        intent = "MULTIPLE_COMPLAINT_LINKED_ACCOUNTS"
        applied_filters = {"complaint_count": ">= 2"}
        # Subquery accounts with >= 2 complaints
        accs = db.query(Account).filter(Account.risk_score >= 60.0).order_by(Account.complaint_risk.desc()).all()
        accs = [a for a in accs if len(a.complaints) >= 2]

    # Pattern 3: Rapid fund transfers
    elif "rapid" in q or "velocity" in q or "fast" in q or "transfer" in q and "rapid" in q:
        intent = "RAPID_FUND_TRANSFER_ACCOUNTS"
        applied_filters = {"behaviour_pattern": "RAPID_DIVERSION", "behaviour_risk": ">= 75"}
        accs = db.query(Account).filter(
            Account.behaviour_risk >= 75.0
        ).order_by(Account.behaviour_risk.desc()).all()

    # Pattern 4: Suspicious networks with more than 5 accounts
    elif "network" in q or "cluster" in q or "syndicate" in q:
        intent = "LARGE_SUSPICIOUS_NETWORKS"
        applied_filters = {"cluster_account_count": ">= 5", "cluster_risk": "CRITICAL/HIGH"}
        accs = db.query(Account).filter(
            Account.cluster_id.isnot(None),
            Account.risk_score >= 65.0
        ).order_by(Account.risk_score.desc()).all()

    # Pattern 5: Sharing device with critical account
    elif "share" in q and ("device" in q or "hardware" in q):
        intent = "SHARED_DEVICE_CRITICAL_NETWORK"
        applied_filters = {"entity_overlap": "SHARED_HARDWARE_FINGERPRINT"}
        # Fetch accounts associated with shared devices
        shared_cust_ids = [d.customer_id for d in db.query(Device).filter(Device.is_shared == True).all()]
        accs = db.query(Account).filter(
            Account.customer_id.in_(shared_cust_ids),
            Account.risk_score >= 60.0
        ).order_by(Account.risk_score.desc()).all()

    # Pattern 6: Dormant activation
    elif "dormant" in q:
        intent = "DORMANT_ACCOUNT_REACTIVATION"
        applied_filters = {"mule_type": "DORMANT ACTIVATION"}
        accs = db.query(Account).filter(
            Account.mule_type == "DORMANT ACTIVATION"
        ).order_by(Account.risk_score.desc()).all()

    # Pattern 7: Funnel mules
    elif "funnel" in q:
        intent = "FUNNEL_CONCENTRATION_MULES"
        applied_filters = {"mule_type": "FUNNEL MULE"}
        accs = db.query(Account).filter(
            Account.mule_type == "FUNNEL MULE"
        ).order_by(Account.risk_score.desc()).all()

    # Fallback keyword match
    else:
        intent = "KEYWORD_FALLBACK"
        applied_filters = {"search_term": query}
        accs = db.query(Account).filter(
            or_(
                Account.account_id.ilike(f"%{query}%"),
                Account.account_number.ilike(f"%{query}%"),
                Account.mule_type.ilike(f"%{query}%")
            )
        ).limit(20).all()

    # Serialize results
    for a in accs[:25]:
        inflow = sum(t.amount for t in a.received_transactions)
        outflow = sum(t.amount for t in a.sent_transactions)
        matched_accounts.append(AccountSummary(
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

    return NLPSearchResult(
        parsed_intent=intent,
        applied_filters=applied_filters,
        matched_accounts=matched_accounts,
        total_matched=len(matched_accounts)
    )
