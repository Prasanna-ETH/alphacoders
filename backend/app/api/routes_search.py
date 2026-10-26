from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.entities import Account, Customer, Complaint, Phone, Device, UPI
from app.schemas.schemas import (
    GlobalSearchResult, AccountSummary, ComplaintItem,
    NLPSearchQuery, NLPSearchResult, HiddenLinksResponse
)
from app.services.nlp_search import parse_and_execute_nlp_query
from app.services.hidden_links import discover_hidden_links

router = APIRouter()

@router.get("", response_model=GlobalSearchResult)
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    term = f"%{q}%"

    # Accounts
    accs = db.query(Account).join(Customer).filter(
        or_(
            Account.account_id.ilike(term),
            Account.account_number.ilike(term),
            Customer.name.ilike(term),
            Account.bank_name.ilike(term),
            Account.mule_type.ilike(term)
        )
    ).limit(10).all()

    account_summaries = []
    for a in accs:
        inflow = sum(t.amount for t in a.received_transactions)
        outflow = sum(t.amount for t in a.sent_transactions)
        account_summaries.append(AccountSummary(
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

    # Complaints
    comps = db.query(Complaint).filter(
        or_(
            Complaint.complaint_id.ilike(term),
            Complaint.victim_name.ilike(term),
            Complaint.fraud_type.ilike(term),
            Complaint.acknowledgement_no.ilike(term)
        )
    ).limit(10).all()
    complaint_items = [
        ComplaintItem(
            complaint_id=c.complaint_id,
            reported_date=c.reported_date,
            fraud_type=c.fraud_type,
            amount=c.amount,
            victim_name=c.victim_name,
            victim_contact=c.victim_contact,
            linked_account_id=c.linked_account_id,
            channel=c.channel,
            status=c.status,
            police_station=c.police_station,
            acknowledgement_no=c.acknowledgement_no,
            description=c.description
        )
        for c in comps
    ]

    # Phones
    phns = db.query(Phone).filter(Phone.phone_number.ilike(term)).limit(10).all()
    phone_items = [{"phone_id": p.phone_id, "phone_number": p.phone_number, "carrier": p.carrier, "is_shared": p.is_shared} for p in phns]

    # Devices
    devs = db.query(Device).filter(or_(Device.device_fingerprint.ilike(term), Device.ip_address.ilike(term))).limit(10).all()
    device_items = [{"device_id": d.device_id, "fingerprint": d.device_fingerprint, "type": d.device_type, "is_shared": d.is_shared} for d in devs]

    # UPI
    upis = db.query(UPI).filter(UPI.vpa_handle.ilike(term)).limit(10).all()
    upi_items = [{"upi_id": u.upi_id, "vpa_handle": u.vpa_handle, "account_id": u.account_id} for u in upis]

    return GlobalSearchResult(
        query=q,
        accounts=account_summaries,
        complaints=complaint_items,
        phones=phone_items,
        devices=device_items,
        upi_ids=upi_items
    )

@router.post("/nlp", response_model=NLPSearchResult)
def natural_language_search(body: NLPSearchQuery, db: Session = Depends(get_db)):
    return parse_and_execute_nlp_query(body.query, db)

@router.get("/hidden-links", response_model=HiddenLinksResponse)
def get_hidden_links(
    source: str = Query(..., description="Source account or complaint ID"),
    target: str = Query(..., description="Target account or complaint ID"),
    db: Session = Depends(get_db)
):
    return discover_hidden_links(source, target, db)
