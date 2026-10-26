export interface CustomerBasic {
  customer_id: string;
  name: string;
  email?: string;
  national_id?: string;
  occupation?: string;
  risk_profile?: string;
  city?: string;
  state?: string;
}

export interface AccountSummary {
  account_id: string;
  account_number: string;
  customer_name: string;
  customer_id: string;
  bank_name: string;
  account_type: string;
  balance: number;
  risk_score: number;
  risk_level: string;
  mule_type: string;
  confidence: number;
  inflow: number;
  outflow: number;
  complaints_count: number;
  cluster_id?: string;
  last_active_at?: string;
}

export interface AccountDetail extends AccountSummary {
  branch: string;
  opening_date: string;
  status: string;
  kyc_status: string;
  behaviour_risk: number;
  network_risk: number;
  complaint_risk: number;
  flagged_reason?: string;
  customer?: CustomerBasic;
  phones: string[];
  devices: string[];
  upi_ids: string[];
}

export interface FeatureContribution {
  feature_name: string;
  display_name: string;
  impact: number;
  direction: "POSITIVE" | "NEGATIVE";
  formatted_value: string;
  description: string;
}

export interface BehaviouralFingerprintResponse {
  account_id: string;
  account_number: string;
  mule_type: string;
  confidence: number;
  risk_score: number;
  risk_level: string;
  features: {
    transaction_count: number;
    inbound_count: number;
    outbound_count: number;
    inflow: number;
    outflow: number;
    inflow_outflow_ratio: number;
    average_transaction_amount: number;
    median_transaction_amount: number;
    unique_senders: number;
    unique_receivers: number;
    fan_in: number;
    fan_out: number;
    avg_receive_to_send_minutes: number;
    rapid_transfer_ratio: number;
    dormancy_duration_days: number;
    activity_burst_score: number;
    account_turnover: number;
    complaint_count: number;
    complaint_amount: number;
    suspicious_neighbour_count: number;
    network_centrality: number;
    network_risk: number;
  };
  risk_components: {
    behaviour_risk: number;
    network_risk: number;
    complaint_risk: number;
    composite_risk: number;
  };
  top_indicators: string[];
  positive_contributors: FeatureContribution[];
  negative_contributors: FeatureContribution[];
  classification_rationale: string;
}

export interface TransactionItem {
  transaction_id: string;
  sender_account_id: string;
  sender_number?: string;
  receiver_account_id: string;
  receiver_number?: string;
  amount: number;
  channel: string;
  timestamp: string;
  status: string;
  description?: string;
  is_suspicious: boolean;
  scenario_tag?: string;
}

export interface ComplaintItem {
  complaint_id: string;
  reported_date: string;
  fraud_type: string;
  amount: number;
  victim_name: string;
  victim_contact?: string;
  linked_account_id: string;
  linked_account_number?: string;
  channel: string;
  status: string;
  police_station?: string;
  acknowledgement_no?: string;
  description?: string;
}

export interface MoneyTrailHop {
  hop_number: number;
  source_account_id: string;
  source_account_number: string;
  target_account_id: string;
  target_account_number: string;
  amount: number;
  timestamp: string;
  channel: string;
  time_elapsed_minutes?: number;
  cumulative_amount: number;
  is_complaint_linked: boolean;
  complaint_ids: string[];
}

export interface MoneyTrailResponse {
  root_account_id: string;
  root_account_number: string;
  direction: string;
  max_depth: number;
  total_flow_amount: number;
  hops_count: number;
  unique_accounts_count: number;
  total_duration_minutes: number;
  hops: MoneyTrailHop[];
  nodes: any[];
  links: any[];
}

export interface CytoscapeElement {
  data: {
    id: string;
    label: string;
    type?: string;
    source?: string;
    target?: string;
    risk_score?: number;
    risk_level?: string;
    subtitle?: string;
    amount?: number;
    channel?: string;
    is_suspicious?: boolean;
    details?: any;
    [key: string]: any;
  };
  classes?: string;
}

export interface CytoscapeGraphResponse {
  elements: CytoscapeElement[];
  summary: {
    total_nodes: number;
    total_edges: number;
    [key: string]: any;
  };
}

export interface NetworkClusterItem {
  cluster_id: string;
  name: string;
  risk_level: string;
  cluster_type: string;
  account_count: number;
  total_flow: number;
  complaint_count: number;
  description?: string;
  created_at: string;
}

export interface InvestigationNoteItem {
  note_id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface EvidenceItem {
  evidence_id: string;
  evidence_type: string;
  entity_id: string;
  description: string;
  added_at: string;
}

export interface InvestigationDetail {
  investigation_id: string;
  case_number: string;
  title: string;
  subject_account_id: string;
  subject_account_number: string;
  status: string;
  priority: string;
  investigator_name: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  notes: InvestigationNoteItem[];
  evidence_items: EvidenceItem[];
}

export interface InvestigationBrief {
  case_id: string;
  subject_account: string;
  account_holder: string;
  risk_score: number;
  risk_level: string;
  mule_type: string;
  confidence: number;
  generated_at: string;
  executive_summary: string;
  key_findings: string[];
  risk_contributors: string[];
  money_trail_summary: string;
  connected_complaints: {
    complaint_id: string;
    fraud_type: string;
    amount: number;
    reported_date: string;
    victim: string;
    station?: string;
  }[];
  network_summary: string;
  investigation_leads: string[];
  evidence_references: string[];
  compliance_disclaimer: string;
}

export interface AlertItem {
  alert_id: string;
  alert_type: string;
  account_id: string;
  account_number: string;
  severity: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface DashboardSummaryResponse {
  total_monitored_accounts: number;
  critical_accounts_count: number;
  high_risk_accounts_count: number;
  active_investigations_count: number;
  total_suspicious_flow: number;
  complaint_linked_accounts_count: number;
  detected_network_clusters_count: number;
  priority_queue: AccountSummary[];
  risk_distribution: Record<string, number>;
  fraud_category_distribution: Record<string, number>;
  suspicious_flow_trend: {
    date: string;
    amount: number;
    flagged_count: number;
  }[];
  recent_alerts: AlertItem[];
}

export interface SystemHealthResponse {
  api_status: string;
  database_status: string;
  ml_engine_status: string;
  graph_engine_status: string;
  environment: string;
  model_version: string;
  total_accounts: number;
  total_transactions: number;
  total_complaints: number;
  total_customers: number;
  last_ingestion: string;
  validation_metrics: {
    accuracy: number;
    roc_auc: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
}

export interface HiddenConnectionPath {
  source_entity: string;
  target_entity: string;
  connection_type: string;
  path: {
    entity: string;
    type: string;
    label: string;
  }[];
  risk_level: string;
  explanation: string;
}

export interface HiddenLinksResponse {
  total_found: number;
  paths: HiddenConnectionPath[];
}
