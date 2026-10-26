from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.entities import Account, Customer, Transaction, Complaint, Phone, Device, UPI
from app.schemas.schemas import (
    AccountSummary, AccountDetail, CustomerBasic, BehaviouralFingerprintResponse,
    RiskScoreResponse, TransactionItem, ComplaintItem, CytoscapeGraphResponse
)
from app.services.fingerprint import compute_account_fingerprint
from app.services.explainability import calculate_feature_explanations
from app.services.graph_engine import graph_engine

router = APIRouter()

@router.get("", response_model=List[AccountSummary])
def list_accounts(
    risk_level: Optional[str] = None,
    mule_type: Optional[str] = None,
    min_risk: Optional[float] = None,
    complaint_linked: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Account)

    if risk_level:
        query = query.filter(Account.risk_level == risk_level.upper())
    if mule_type:
        query = query.filter(Account.mule_type == mule_type)
    if min_risk is not None:
        query = query.filter(Account.risk_score >= min_risk)
    if complaint_linked:
        query = query.join(Complaint).distinct()
    if search:
        s = f"%{search}%"
        query = query.join(Customer).filter(
            or_(
                Account.account_id.ilike(s),
                Account.account_number.ilike(s),
                Customer.name.ilike(s),
                Account.mule_type.ilike(s)
            )
        )

    # Order by risk score desc
    accounts = query.order_by(Account.risk_score.desc()).offset(offset).limit(limit).all()

    results = []
    for a in accounts:
        inflow = sum(t.amount for t in a.received_transactions)
        outflow = sum(t.amount for t in a.sent_transactions)
        results.append(AccountSummary(
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
    return results

@router.get("/{account_id}", response_model=AccountDetail)
def get_account_detail(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    cust = account.customer
    customer_basic = None
    phones = []
    devices = []
    if cust:
        customer_basic = CustomerBasic(
            customer_id=cust.customer_id,
            name=cust.name,
            email=cust.email,
            national_id=cust.national_id,
            occupation=cust.occupation,
            risk_profile=cust.risk_profile,
            city=cust.city,
            state=cust.state
        )
        phones = [p.phone_number for p in cust.phones]
        devices = [f"{d.device_type} ({d.device_fingerprint})" for d in cust.devices]

    upi_handles = [u.vpa_handle for u in account.upi_ids]
    inflow = sum(t.amount for t in account.received_transactions)
    outflow = sum(t.amount for t in account.sent_transactions)

    return AccountDetail(
        account_id=account.account_id,
        account_number=account.account_number,
        customer_name=cust.name if cust else "Unknown",
        customer_id=account.customer_id,
        bank_name=account.bank_name,
        account_type=account.account_type,
        branch=account.branch,
        balance=account.balance,
        opening_date=account.opening_date,
        status=account.status,
        kyc_status=account.kyc_status,
        risk_score=account.risk_score,
        risk_level=account.risk_level,
        mule_type=account.mule_type,
        confidence=account.confidence,
        behaviour_risk=account.behaviour_risk,
        network_risk=account.network_risk,
        complaint_risk=account.complaint_risk,
        flagged_reason=account.flagged_reason,
        cluster_id=account.cluster_id,
        inflow=round(inflow, 2),
        outflow=round(outflow, 2),
        complaints_count=len(account.complaints),
        last_active_at=account.last_active_at,
        customer=customer_basic,
        phones=phones,
        devices=devices,
        upi_ids=upi_handles
    )

@router.get("/{account_id}/fingerprint", response_model=BehaviouralFingerprintResponse)
def get_account_fingerprint(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    features = compute_account_fingerprint(account_id, db)
    if not features:
        raise HTTPException(status_code=500, detail="Could not compute fingerprint")

    explanations = calculate_feature_explanations(features, {"kyc_status": account.kyc_status})

    risk_components = {
        "behaviour_risk": account.behaviour_risk,
        "network_risk": account.network_risk,
        "complaint_risk": account.complaint_risk,
        "composite_risk": account.risk_score
    }

    return BehaviouralFingerprintResponse(
        account_id=account.account_id,
        account_number=account.account_number,
        mule_type=account.mule_type,
        confidence=account.confidence,
        risk_score=account.risk_score,
        risk_level=account.risk_level,
        features=features,
        risk_components=risk_components,
        top_indicators=explanations["top_indicators"],
        positive_contributors=explanations["positive_contributors"],
        negative_contributors=explanations["negative_contributors"],
        classification_rationale=account.flagged_reason or "Automated behavioral analysis."
    )

@router.get("/{account_id}/risk", response_model=RiskScoreResponse)
def get_account_risk(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    features = compute_account_fingerprint(account_id, db) or {}
    explanations = calculate_feature_explanations(features, {"kyc_status": account.kyc_status})

    return RiskScoreResponse(
        account_id=account.account_id,
        risk_score=account.risk_score,
        risk_level=account.risk_level,
        confidence=account.confidence,
        behaviour_risk=account.behaviour_risk,
        network_risk=account.network_risk,
        complaint_risk=account.complaint_risk,
        model_version="LightGBM-Hybrid-v1.4",
        calculated_at=datetime.utcnow(),
        top_factors=explanations.get("top_indicators", [])
    )

@router.get("/{account_id}/transactions", response_model=List[TransactionItem])
def get_account_transactions(account_id: str, limit: int = 50, db: Session = Depends(get_db)):
    txns = db.query(Transaction).filter(
        or_(
            Transaction.sender_account_id == account_id,
            Transaction.receiver_account_id == account_id
        )
    ).order_by(Transaction.timestamp.desc()).limit(limit).all()

    results = []
    for t in txns:
        s_acc = db.query(Account).filter(Account.account_id == t.sender_account_id).first()
        r_acc = db.query(Account).filter(Account.account_id == t.receiver_account_id).first()
        results.append(TransactionItem(
            transaction_id=t.transaction_id,
            sender_account_id=t.sender_account_id,
            sender_number=s_acc.account_number if s_acc else t.sender_account_id,
            receiver_account_id=t.receiver_account_id,
            receiver_number=r_acc.account_number if r_acc else t.receiver_account_id,
            amount=t.amount,
            channel=t.channel,
            timestamp=t.timestamp,
            status=t.status,
            description=t.description,
            is_suspicious=t.is_suspicious,
            scenario_tag=t.scenario_tag
        ))
    return results

@router.get("/{account_id}/complaints", response_model=List[ComplaintItem])
def get_account_complaints(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    complaints = db.query(Complaint).filter(Complaint.linked_account_id == account_id).all()
    return [
        ComplaintItem(
            complaint_id=c.complaint_id,
            reported_date=c.reported_date,
            fraud_type=c.fraud_type,
            amount=c.amount,
            victim_name=c.victim_name,
            victim_contact=c.victim_contact,
            linked_account_id=c.linked_account_id,
            linked_account_number=account.account_number,
            channel=c.channel,
            status=c.status,
            police_station=c.police_station,
            acknowledgement_no=c.acknowledgement_no,
            description=c.description
        )
        for c in complaints
    ]

@router.get("/{account_id}/network", response_model=CytoscapeGraphResponse)
def get_account_network(account_id: str, depth: int = Query(2, ge=1, le=3), db: Session = Depends(get_db)):
    return graph_engine.build_account_subgraph(account_id, db, depth=depth)
