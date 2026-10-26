from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.entities import Complaint, Account
from app.schemas.schemas import ComplaintItem

router = APIRouter()

@router.get("", response_model=List[ComplaintItem])
def list_complaints(
    fraud_type: Optional[str] = None,
    channel: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if fraud_type:
        query = query.filter(Complaint.fraud_type == fraud_type)
    if channel:
        query = query.filter(Complaint.channel == channel)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Complaint.complaint_id.ilike(s)) |
            (Complaint.victim_name.ilike(s)) |
            (Complaint.police_station.ilike(s)) |
            (Complaint.acknowledgement_no.ilike(s))
        )
    complaints = query.order_by(Complaint.reported_date.desc()).offset(offset).limit(limit).all()

    results = []
    for c in complaints:
        acc = db.query(Account).filter(Account.account_id == c.linked_account_id).first()
        results.append(ComplaintItem(
            complaint_id=c.complaint_id,
            reported_date=c.reported_date,
            fraud_type=c.fraud_type,
            amount=c.amount,
            victim_name=c.victim_name,
            victim_contact=c.victim_contact,
            linked_account_id=c.linked_account_id,
            linked_account_number=acc.account_number if acc else c.linked_account_id,
            channel=c.channel,
            status=c.status,
            police_station=c.police_station,
            acknowledgement_no=c.acknowledgement_no,
            description=c.description
        ))
    return results

@router.get("/{complaint_id}", response_model=ComplaintItem)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    acc = db.query(Account).filter(Account.account_id == c.linked_account_id).first()
    return ComplaintItem(
        complaint_id=c.complaint_id,
        reported_date=c.reported_date,
        fraud_type=c.fraud_type,
        amount=c.amount,
        victim_name=c.victim_name,
        victim_contact=c.victim_contact,
        linked_account_id=c.linked_account_id,
        linked_account_number=acc.account_number if acc else c.linked_account_id,
        channel=c.channel,
        status=c.status,
        police_station=c.police_station,
        acknowledgement_no=c.acknowledgement_no,
        description=c.description
    )
