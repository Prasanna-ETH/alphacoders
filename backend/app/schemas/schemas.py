from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Customer & Account Schemas ---
class CustomerBasic(BaseModel):
    customer_id: str
    name: str
    email: Optional[str] = None
    national_id: Optional[str] = None
    occupation: Optional[str] = None
    risk_profile: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class AccountSummary(BaseModel):
    account_id: str
    account_number: str
    customer_name: str
    customer_id: str
    bank_name: str
    account_type: str
    balance: float
    risk_score: float
    risk_level: str
    mule_type: str
    confidence: float
    inflow: float
    outflow: float
    complaints_count: int
    cluster_id: Optional[str] = None
    last_active_at: Optional[datetime] = None

class AccountDetail(AccountSummary):
    branch: str
    opening_date: datetime
    status: str
    kyc_status: str
    behaviour_risk: float
    network_risk: float
    complaint_risk: float
    flagged_reason: Optional[str] = None
    customer: Optional[CustomerBasic] = None
    phones: List[str] = []
    devices: List[str] = []
    upi_ids: List[str] = []

# --- Fingerprint & Risk Schemas ---
class FeatureContribution(BaseModel):
    feature_name: str
    display_name: str
    impact: float
    direction: str  # "POSITIVE" (increases risk) or "NEGATIVE" (decreases risk)
    formatted_value: str
    description: str

class BehaviouralFingerprintResponse(BaseModel):
    account_id: str
    account_number: str
    mule_type: str
    confidence: float
    risk_score: float
    risk_level: str
    
    # Core behavioural features
    features: Dict[str, Any]
    
    # Risk component decomposition
    risk_components: Dict[str, float]
    
    # Explainable AI attributions
    top_indicators: List[str]
    positive_contributors: List[FeatureContribution]
    negative_contributors: List[FeatureContribution]
    classification_rationale: str

class RiskScoreResponse(BaseModel):
    account_id: str
    risk_score: float
    risk_level: str
    confidence: float
    behaviour_risk: float
    network_risk: float
    complaint_risk: float
    model_version: str
    calculated_at: datetime
    top_factors: List[str]

# --- Transactions & Complaints ---
class TransactionItem(BaseModel):
    transaction_id: str
    sender_account_id: str
    sender_number: Optional[str] = None
    receiver_account_id: str
    receiver_number: Optional[str] = None
    amount: float
    channel: str
    timestamp: datetime
    status: str
    description: Optional[str] = None
    is_suspicious: bool
    scenario_tag: Optional[str] = None

class ComplaintItem(BaseModel):
    complaint_id: str
    reported_date: datetime
    fraud_type: str
    amount: float
    victim_name: str
    victim_contact: Optional[str] = None
    linked_account_id: str
    linked_account_number: Optional[str] = None
    channel: str
    status: str
    police_station: Optional[str] = None
    acknowledgement_no: Optional[str] = None
    description: Optional[str] = None

# --- Money Trail ---
class MoneyTrailHop(BaseModel):
    hop_number: int
    source_account_id: str
    source_account_number: str
    target_account_id: str
    target_account_number: str
    amount: float
    timestamp: datetime
    channel: str
    time_elapsed_minutes: Optional[float] = None
    cumulative_amount: float
    is_complaint_linked: bool
    complaint_ids: List[str] = []

class MoneyTrailResponse(BaseModel):
    root_account_id: str
    root_account_number: str
    direction: str
    max_depth: int
    total_flow_amount: float
    hops_count: int
    unique_accounts_count: int
    total_duration_minutes: float
    hops: List[MoneyTrailHop]
    nodes: List[Dict[str, Any]]
    links: List[Dict[str, Any]]

# --- Graph Models (Cytoscape compatible) ---
class CytoscapeNodeData(BaseModel):
    id: str
    label: str
    type: str  # Account, Person, Phone, Device, Complaint, UPI
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    subtitle: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class CytoscapeEdgeData(BaseModel):
    id: str
    source: str
    target: str
    label: str
    type: str  # TRANSFER, OWNS, USES, SHARES_DEVICE, SHARES_PHONE, LINKED_TO, CONNECTED_TO
    amount: Optional[float] = None
    timestamp: Optional[str] = None
    is_suspicious: Optional[bool] = False

class CytoscapeElement(BaseModel):
    data: Dict[str, Any]
    classes: Optional[str] = None

class CytoscapeGraphResponse(BaseModel):
    elements: List[CytoscapeElement]
    summary: Dict[str, Any]

class HiddenConnectionPath(BaseModel):
    source_entity: str
    target_entity: str
    connection_type: str
    path: List[Dict[str, str]]
    risk_level: str
    explanation: str

class HiddenLinksResponse(BaseModel):
    total_found: int
    paths: List[HiddenConnectionPath]

# --- Network Cluster ---
class NetworkClusterItem(BaseModel):
    cluster_id: str
    name: str
    risk_level: str
    cluster_type: str
    account_count: int
    total_flow: float
    complaint_count: int
    description: Optional[str] = None
    created_at: datetime

# --- Investigations ---
class InvestigationNoteCreate(BaseModel):
    author: Optional[str] = "Investigator"
    text: str

class InvestigationNoteItem(BaseModel):
    note_id: str
    author: str
    text: str
    created_at: datetime

class EvidenceItem(BaseModel):
    evidence_id: str
    evidence_type: str
    entity_id: str
    description: str
    added_at: datetime

class EvidenceCreate(BaseModel):
    evidence_type: str
    entity_id: str
    description: str

class InvestigationCreate(BaseModel):
    subject_account_id: str
    title: Optional[str] = None
    priority: Optional[str] = "HIGH"
    investigator_name: Optional[str] = "Special Agent / Analyst"
    summary: Optional[str] = None

class InvestigationDetail(BaseModel):
    investigation_id: str
    case_number: str
    title: str
    subject_account_id: str
    subject_account_number: str
    status: str
    priority: str
    investigator_name: str
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    notes: List[InvestigationNoteItem] = []
    evidence_items: List[EvidenceItem] = []

class InvestigationBrief(BaseModel):
    case_id: str
    subject_account: str
    account_holder: str
    risk_score: float
    risk_level: str
    mule_type: str
    confidence: float
    generated_at: datetime
    executive_summary: str
    key_findings: List[str]
    risk_contributors: List[str]
    money_trail_summary: str
    connected_complaints: List[Dict[str, Any]]
    network_summary: str
    investigation_leads: List[str]
    evidence_references: List[str]
    compliance_disclaimer: str

# --- Alerts ---
class AlertItem(BaseModel):
    alert_id: str
    alert_type: str
    account_id: str
    account_number: str
    severity: str
    reason: str
    status: str
    created_at: datetime

class AlertStatusUpdate(BaseModel):
    status: str

# --- Search & Dashboard ---
class NLPSearchQuery(BaseModel):
    query: str

class NLPSearchResult(BaseModel):
    parsed_intent: str
    applied_filters: Dict[str, Any]
    matched_accounts: List[AccountSummary]
    total_matched: int

class GlobalSearchResult(BaseModel):
    query: str
    accounts: List[AccountSummary]
    complaints: List[ComplaintItem]
    phones: List[Dict[str, Any]]
    devices: List[Dict[str, Any]]
    upi_ids: List[Dict[str, Any]]

class DashboardSummaryResponse(BaseModel):
    total_monitored_accounts: int
    critical_accounts_count: int
    high_risk_accounts_count: int
    active_investigations_count: int
    total_suspicious_flow: float
    complaint_linked_accounts_count: int
    detected_network_clusters_count: int
    priority_queue: List[AccountSummary]
    risk_distribution: Dict[str, int]
    fraud_category_distribution: Dict[str, int]
    suspicious_flow_trend: List[Dict[str, Any]]
    recent_alerts: List[AlertItem]

# --- System Health ---
class SystemHealthResponse(BaseModel):
    api_status: str
    database_status: str
    ml_engine_status: str
    graph_engine_status: str
    environment: str
    model_version: str
    total_accounts: int
    total_transactions: int
    total_complaints: int
    total_customers: int
    last_ingestion: datetime
    validation_metrics: Dict[str, float]
