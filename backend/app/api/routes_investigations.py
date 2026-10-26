from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from app.database import get_db
from app.models.entities import Investigation, Account, Note, Evidence, AuditLog
from app.schemas.schemas import (
    InvestigationDetail, InvestigationCreate, InvestigationNoteCreate,
    InvestigationNoteItem, EvidenceCreate, EvidenceItem
)

router = APIRouter()

@router.get("", response_model=List[InvestigationDetail])
def list_investigations(db: Session = Depends(get_db)):
    invs = db.query(Investigation).order_by(Investigation.updated_at.desc()).all()
    results = []
    for inv in invs:
        acc = db.query(Account).filter(Account.account_id == inv.subject_account_id).first()
        notes = [
            InvestigationNoteItem(note_id=n.note_id, author=n.author, text=n.text, created_at=n.created_at)
            for n in inv.notes
        ]
        evidence = [
            EvidenceItem(evidence_id=e.evidence_id, evidence_type=e.evidence_type, entity_id=e.entity_id, description=e.description, added_at=e.added_at)
            for e in inv.evidence_items
        ]
        results.append(InvestigationDetail(
            investigation_id=inv.investigation_id,
            case_number=inv.case_number,
            title=inv.title,
            subject_account_id=inv.subject_account_id,
            subject_account_number=acc.account_number if acc else inv.subject_account_id,
            status=inv.status,
            priority=inv.priority,
            investigator_name=inv.investigator_name,
            summary=inv.summary,
            created_at=inv.created_at,
            updated_at=inv.updated_at,
            notes=notes,
            evidence_items=evidence
        ))
    return results

@router.post("", response_model=InvestigationDetail)
def create_investigation(data: InvestigationCreate, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.account_id == data.subject_account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Subject account not found")

    case_num = f"CASE MXL-2026-{uuid.uuid4().hex[:6].upper()}"
    title = data.title or f"Mule Syndicate Investigation ({acc.account_number[-6:]} / {acc.mule_type})"
    inv_id = f"INV-{uuid.uuid4().hex[:8]}"

    inv = Investigation(
        investigation_id=inv_id,
        case_number=case_num,
        title=title,
        subject_account_id=acc.account_id,
        status="OPEN",
        priority=data.priority or "HIGH",
        investigator_name=data.investigator_name or "Financial Crimes Investigator",
        summary=data.summary or f"Automated case initialization for account {acc.account_number} exhibiting {acc.mule_type} indicators.",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(inv)

    # Initial Note
    db.add(Note(
        note_id=f"NOTE-{uuid.uuid4().hex[:6]}",
        investigation_id=inv_id,
        author=inv.investigator_name,
        text="Case opened. Preliminary automated behavioral heuristics flagged high pass-through velocity and regulatory complaints.",
        created_at=datetime.utcnow()
    ))

    # Audit Log
    db.add(AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:6]}",
        entity_type="INVESTIGATION",
        entity_id=inv_id,
        action="CASE_CREATED",
        investigator=inv.investigator_name,
        details=f"Case initialized for account {acc.account_id}",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    db.refresh(inv)

    notes = [
        InvestigationNoteItem(note_id=n.note_id, author=n.author, text=n.text, created_at=n.created_at)
        for n in inv.notes
    ]
    return InvestigationDetail(
        investigation_id=inv.investigation_id,
        case_number=inv.case_number,
        title=inv.title,
        subject_account_id=inv.subject_account_id,
        subject_account_number=acc.account_number,
        status=inv.status,
        priority=inv.priority,
        investigator_name=inv.investigator_name,
        summary=inv.summary,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        notes=notes,
        evidence_items=[]
    )

@router.get("/{investigation_id}", response_model=InvestigationDetail)
def get_investigation(investigation_id: str, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.investigation_id == investigation_id).first()
    if not inv:
        # Check by subject account id
        inv = db.query(Investigation).filter(Investigation.subject_account_id == investigation_id).first()
        if not inv:
            raise HTTPException(status_code=404, detail="Investigation not found")

    acc = db.query(Account).filter(Account.account_id == inv.subject_account_id).first()
    notes = [
        InvestigationNoteItem(note_id=n.note_id, author=n.author, text=n.text, created_at=n.created_at)
        for n in inv.notes
    ]
    evidence = [
        EvidenceItem(evidence_id=e.evidence_id, evidence_type=e.evidence_type, entity_id=e.entity_id, description=e.description, added_at=e.added_at)
        for e in inv.evidence_items
    ]
    return InvestigationDetail(
        investigation_id=inv.investigation_id,
        case_number=inv.case_number,
        title=inv.title,
        subject_account_id=inv.subject_account_id,
        subject_account_number=acc.account_number if acc else inv.subject_account_id,
        status=inv.status,
        priority=inv.priority,
        investigator_name=inv.investigator_name,
        summary=inv.summary,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        notes=notes,
        evidence_items=evidence
    )

@router.post("/{investigation_id}/notes", response_model=InvestigationNoteItem)
def add_investigation_note(investigation_id: str, data: InvestigationNoteCreate, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.investigation_id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    note = Note(
        note_id=f"NOTE-{uuid.uuid4().hex[:6]}",
        investigation_id=inv.investigation_id,
        author=data.author or "Investigator",
        text=data.text,
        created_at=datetime.utcnow()
    )
    db.add(note)
    inv.updated_at = datetime.utcnow()

    db.add(AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:6]}",
        entity_type="INVESTIGATION",
        entity_id=inv.investigation_id,
        action="NOTE_ADDED",
        investigator=note.author,
        details=f"Note: {data.text[:40]}...",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    db.refresh(note)
    return InvestigationNoteItem(note_id=note.note_id, author=note.author, text=note.text, created_at=note.created_at)

@router.post("/{investigation_id}/evidence", response_model=EvidenceItem)
def add_investigation_evidence(investigation_id: str, data: EvidenceCreate, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.investigation_id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    ev = Evidence(
        evidence_id=f"EVD-{uuid.uuid4().hex[:6]}",
        investigation_id=inv.investigation_id,
        evidence_type=data.evidence_type,
        entity_id=data.entity_id,
        description=data.description,
        added_at=datetime.utcnow()
    )
    db.add(ev)
    inv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ev)
    return EvidenceItem(evidence_id=ev.evidence_id, evidence_type=ev.evidence_type, entity_id=ev.entity_id, description=ev.description, added_at=ev.added_at)
