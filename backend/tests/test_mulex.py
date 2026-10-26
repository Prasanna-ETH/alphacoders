import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.services.data_generator import generate_synthetic_data
from app.services.risk_engine import risk_engine
from app.services.fingerprint import compute_account_fingerprint
from app.services.money_trail import trace_money_trail
from app.services.graph_engine import graph_engine
from app.services.hidden_links import discover_hidden_links
from app.services.report_generator import generate_investigation_brief

# Test in-memory or file database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_mulex.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    generate_synthetic_data(db, force_reset=True)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_hero_account_acc_2847():
    response = client.get("/api/accounts/ACC-2847")
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == "ACC-2847"
    assert data["risk_score"] >= 80.0
    assert data["risk_level"] == "CRITICAL"
    assert data["mule_type"] == "PASS-THROUGH MULE"
    assert data["complaints_count"] == 6

def test_fingerprint_calculation():
    db = TestingSessionLocal()
    fp = compute_account_fingerprint("ACC-2847", db)
    db.close()
    assert fp is not None
    assert fp["transaction_count"] >= 6
    assert fp["complaint_count"] == 6
    assert fp["rapid_transfer_ratio"] >= 0.50
    assert fp["avg_receive_to_send_minutes"] <= 15.0

def test_composite_risk_engine():
    score, level, conf = risk_engine.compute_composite_risk(90.0, 85.0, 95.0)
    assert score >= 80.0
    assert level == "CRITICAL"
    assert conf >= 85.0

def test_money_trail_endpoint():
    response = client.get("/api/investigations/money-trail/ACC-2847?direction=BOTH&depth=3")
    assert response.status_code == 200
    trail = response.json()
    assert trail["root_account_id"] == "ACC-2847"
    assert len(trail["hops"]) > 0
    assert trail["total_flow_amount"] > 0

def test_graph_generation():
    db = TestingSessionLocal()
    graph = graph_engine.build_account_subgraph("ACC-2847", db, depth=2)
    db.close()
    assert len(graph.elements) > 0
    assert graph.summary["total_nodes"] > 0
    node_types = set(e.data.get("type") for e in graph.elements if "type" in e.data)
    assert "Account" in node_types

def test_hidden_links_discovery():
    db = TestingSessionLocal()
    # ACC-2847 and ACC-7721 share device D17
    links = discover_hidden_links("ACC-2847", "ACC-7721", db)
    db.close()
    assert links.total_found >= 1
    assert any(p.connection_type == "SHARED_HARDWARE_FINGERPRINT" for p in links.paths)

def test_investigation_brief_report():
    db = TestingSessionLocal()
    brief = generate_investigation_brief("INV-2026-00421", db)
    db.close()
    assert brief is not None
    assert brief.risk_score >= 80.0
    assert "ACC-2847" in brief.executive_summary or "501004822847" in brief.executive_summary
    assert len(brief.key_findings) > 0
    assert len(brief.investigation_leads) > 0

def test_nlp_search():
    response = client.post("/api/search/nlp", json={"query": "Show high-risk pass-through mules"})
    assert response.status_code == 200
    res = response.json()
    assert res["parsed_intent"] == "HIGH_RISK_PASS_THROUGH_MULES"
    assert res["total_matched"] > 0

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_monitored_accounts"] > 0
    assert data["critical_accounts_count"] > 0
    assert len(data["priority_queue"]) > 0
