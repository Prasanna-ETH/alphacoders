from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services.money_trail import trace_money_trail
from app.schemas.schemas import MoneyTrailResponse

router = APIRouter()

@router.get("/money-trail/{account_id}", response_model=MoneyTrailResponse)
def get_money_trail(
    account_id: str,
    direction: str = Query("BOTH", pattern="^(INBOUND|OUTBOUND|BOTH)$"),
    depth: int = Query(4, ge=1, le=5),
    min_amount: float = Query(0.0, ge=0.0),
    time_window_hours: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db)
):
    trail = trace_money_trail(
        account_id=account_id,
        db=db,
        direction=direction,
        max_depth=depth,
        min_amount=min_amount,
        time_window_hours=time_window_hours
    )
    return trail
