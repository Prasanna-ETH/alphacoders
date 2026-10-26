import {
  DashboardSummaryResponse,
  AccountSummary,
  AccountDetail,
  BehaviouralFingerprintResponse,
  TransactionItem,
  ComplaintItem,
  MoneyTrailResponse,
  CytoscapeGraphResponse,
  NetworkClusterItem,
  InvestigationDetail,
  InvestigationBrief,
  AlertItem,
  SystemHealthResponse,
  HiddenLinksResponse
} from "../types";

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/api";
  }
  return "http://127.0.0.1:8000/api";
};

const API_BASE = getApiBase();

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    cache: "no-store"
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${errorText}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardSummary: () => fetchJson<DashboardSummaryResponse>("/dashboard/summary"),

  // Accounts
  getAccounts: (params?: { risk_level?: string; mule_type?: string; min_risk?: number; complaint_linked?: boolean; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.risk_level) q.append("risk_level", params.risk_level);
    if (params?.mule_type) q.append("mule_type", params.mule_type);
    if (params?.min_risk !== undefined) q.append("min_risk", params.min_risk.toString());
    if (params?.complaint_linked) q.append("complaint_linked", "true");
    if (params?.search) q.append("search", params.search);
    if (params?.limit) q.append("limit", params.limit.toString());
    return fetchJson<AccountSummary[]>(`/accounts?${q.toString()}`);
  },

  getAccountDetail: (id: string) => fetchJson<AccountDetail>(`/accounts/${id}`),
  getAccountFingerprint: (id: string) => fetchJson<BehaviouralFingerprintResponse>(`/accounts/${id}/fingerprint`),
  getAccountTransactions: (id: string, limit: number = 50) => fetchJson<TransactionItem[]>(`/accounts/${id}/transactions?limit=${limit}`),
  getAccountComplaints: (id: string) => fetchJson<ComplaintItem[]>(`/accounts/${id}/complaints`),
  getAccountNetwork: (id: string, depth: number = 2) => fetchJson<CytoscapeGraphResponse>(`/accounts/${id}/network?depth=${depth}`),

  // Money Trail
  getMoneyTrail: (id: string, params?: { direction?: string; depth?: number; min_amount?: number; time_window_hours?: number }) => {
    const q = new URLSearchParams();
    if (params?.direction) q.append("direction", params.direction);
    if (params?.depth) q.append("depth", params.depth.toString());
    if (params?.min_amount) q.append("min_amount", params.min_amount.toString());
    if (params?.time_window_hours) q.append("time_window_hours", params.time_window_hours.toString());
    return fetchJson<MoneyTrailResponse>(`/investigations/money-trail/${id}?${q.toString()}`);
  },

  // Networks
  getNetworks: () => fetchJson<NetworkClusterItem[]>("/networks"),
  getNetworkClusterGraph: (clusterId: string) => fetchJson<CytoscapeGraphResponse>(`/networks/${clusterId}/graph`),

  // Complaints
  getComplaints: (params?: { fraud_type?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.fraud_type) q.append("fraud_type", params.fraud_type);
    if (params?.search) q.append("search", params.search);
    if (params?.limit) q.append("limit", params.limit.toString());
    return fetchJson<ComplaintItem[]>(`/complaints?${q.toString()}`);
  },
  getComplaint: (id: string) => fetchJson<ComplaintItem>(`/complaints/${id}`),

  // Investigations
  getInvestigations: () => fetchJson<InvestigationDetail[]>("/investigations"),
  getInvestigation: (id: string) => fetchJson<InvestigationDetail>(`/investigations/${id}`),
  createInvestigation: (data: { subject_account_id: string; title?: string; priority?: string; investigator_name?: string; summary?: string }) =>
    fetchJson<InvestigationDetail>("/investigations", { method: "POST", body: JSON.stringify(data) }),
  addInvestigationNote: (id: string, text: string, author?: string) =>
    fetchJson<any>(`/investigations/${id}/notes`, { method: "POST", body: JSON.stringify({ text, author }) }),
  addInvestigationEvidence: (id: string, evidence_type: string, entity_id: string, description: string) =>
    fetchJson<any>(`/investigations/${id}/evidence`, { method: "POST", body: JSON.stringify({ evidence_type, entity_id, description }) }),

  // Reports
  getInvestigationBrief: (investigationOrAccountId: string) =>
    fetchJson<InvestigationBrief>(`/reports/${investigationOrAccountId}`),
  getPdfBriefUrl: (investigationOrAccountId: string) =>
    `${API_BASE}/reports/${investigationOrAccountId}/pdf`,

  // Alerts
  getAlerts: (severity?: string, status?: string) => {
    const q = new URLSearchParams();
    if (severity) q.append("severity", severity);
    if (status) q.append("status", status);
    return fetchJson<AlertItem[]>(`/alerts?${q.toString()}`);
  },
  updateAlertStatus: (alertId: string, status: string) =>
    fetchJson<AlertItem>(`/alerts/${alertId}/status`, { method: "POST", body: JSON.stringify({ status }) }),

  // Search & Hidden Links
  globalSearch: (q: string) => fetchJson<any>(`/search?q=${encodeURIComponent(q)}`),
  nlpSearch: (query: string) =>
    fetchJson<any>("/search/nlp", { method: "POST", body: JSON.stringify({ query }) }),
  getHiddenLinks: (source: string, target: string) =>
    fetchJson<HiddenLinksResponse>(`/search/hidden-links?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`),

  // System Health
  getSystemStats: () => fetchJson<SystemHealthResponse>("/system/stats"),
  reseedDatabase: () => fetchJson<any>("/system/reseed", { method: "POST" })
};
