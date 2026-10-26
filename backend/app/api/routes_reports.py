from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import InvestigationBrief
from app.services.report_generator import generate_investigation_brief, generate_pdf_brief

router = APIRouter()

@router.get("/{investigation_id}", response_model=InvestigationBrief)
def get_report_json(investigation_id: str, db: Session = Depends(get_db)):
    brief = generate_investigation_brief(investigation_id, db)
    if not brief:
        raise HTTPException(status_code=404, detail="Investigation or account not found")
    return brief

@router.get("/{investigation_id}/pdf")
def get_report_pdf(investigation_id: str, db: Session = Depends(get_db)):
    brief = generate_investigation_brief(investigation_id, db)
    if not brief:
        raise HTTPException(status_code=404, detail="Investigation or account not found")
    pdf_bytes = generate_pdf_brief(brief)
    
    filename = f"MULEX_Brief_{brief.case_id.replace(' ', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
