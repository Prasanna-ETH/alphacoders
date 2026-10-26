from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.entities import NetworkCluster
from app.schemas.schemas import NetworkClusterItem, CytoscapeGraphResponse
from app.services.graph_engine import graph_engine

router = APIRouter()

@router.get("", response_model=List[NetworkClusterItem])
def list_networks(db: Session = Depends(get_db)):
    clusters = db.query(NetworkCluster).order_by(NetworkCluster.risk_level.desc()).all()
    return [
        NetworkClusterItem(
            cluster_id=c.cluster_id,
            name=c.name,
            risk_level=c.risk_level,
            cluster_type=c.cluster_type,
            account_count=c.account_count,
            total_flow=c.total_flow,
            complaint_count=c.complaint_count,
            description=c.description,
            created_at=c.created_at
        )
        for c in clusters
    ]

@router.get("/{cluster_id}/graph", response_model=CytoscapeGraphResponse)
def get_network_cluster_graph(cluster_id: str, db: Session = Depends(get_db)):
    res = graph_engine.build_cluster_graph(cluster_id, db)
    if not res.elements:
        raise HTTPException(status_code=404, detail="Network cluster not found or empty")
    return res
