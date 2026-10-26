"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  AccountDetail,
  BehaviouralFingerprintResponse,
  TransactionItem,
  ComplaintItem,
  MoneyTrailResponse,
  CytoscapeGraphResponse,
  InvestigationBrief
} from "@/types";
import { RiskBadge } from "@/components/RiskBadge";
import { CytoscapeGraph } from "@/components/CytoscapeGraph";
import { MoneyTrailViewer } from "@/components/MoneyTrailViewer";
import { InvestigationBriefModal } from "@/components/InvestigationBriefModal";
import {
  ShieldAlert,
  ArrowLeft,
  FileText,
  Clock,
  TrendingDown,
  Layers,
  Network,
  FileWarning,
  CreditCard,
  User,
  Smartphone,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  Zap,
  Info,
  Maximize2,
  DollarSign,
  TrendingUp,
  Cpu
} from "lucide-react";

export default function AccountInvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: accountId } = use(params);

  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [fingerprint, setFingerprint] = useState<BehaviouralFingerprintResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [moneyTrail, setMoneyTrail] = useState<MoneyTrailResponse | null>(null);
  const [graphData, setGraphData] = useState<CytoscapeGraphResponse | null>(null);
  const [brief, setBrief] = useState<InvestigationBrief | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "why_flagged" | "fingerprint" | "money_trail" | "network" | "complaints" | "notes">("overview");

  // Loading
  const [isLoading, setIsLoading] = useState(true);

  // Notes state
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<{ id: string; author: string; text: string; time: string }[]>([
    {
      id: "n-1",
      author: "Analyst R. Varma",
      text: "Pass-through turnaround latency clocked at 5.4 minutes following deposit from victim Rajesh Mehta.",
      time: "2 hours ago"
    },
    {
      id: "n-2",
      author: "Special Agent A. Roy",
      text: "Telecom subpoena pending for device fingerprint FP-MUM-AND-8891-X17. Shared with ACC-7721 verified.",
      time: "1 hour ago"
    }
  ]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [acc, fp, txns, comps, trail, net] = await Promise.all([
          api.getAccountDetail(accountId),
          api.getAccountFingerprint(accountId),
          api.getAccountTransactions(accountId, 50),
          api.getAccountComplaints(accountId),
          api.getMoneyTrail(accountId, { direction: "BOTH", depth: 3 }),
          api.getAccountNetwork(accountId, 2)
        ]);

        setAccount(acc);
        setFingerprint(fp);
        setTransactions(txns);
        setComplaints(comps);
        setMoneyTrail(trail);
        setGraphData(net);
      } catch (err) {
        console.error("Error loading account data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [accountId]);

  const handleOpenBrief = async () => {
    try {
      const b = await api.getInvestigationBrief(accountId);
      setBrief(b);
      setIsBriefModalOpen(true);
    } catch (err) {
      console.error("Failed to generate brief:", err);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNotes([
      ...notes,
      {
        id: `n-${Date.now()}`,
        author: "Investigator",
        text: noteText.trim(),
        time: "Just now"
      }
    ]);
    setNoteText("");
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-xs text-slate-400 gap-3">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span>Synthesizing multi-modal account intelligence for {accountId}...</span>
      </div>
    );
  }

  if (!account || !fingerprint) {
    return (
      <div className="p-8 text-center text-slate-400">
        Account not found in intelligence database.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Accounts Ledger</span>
      </button>

      {/* Target Investigation Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                ACCOUNT {account.account_number}
              </span>
              <RiskBadge score={account.risk_score} level={account.risk_level} size="md" />
              <span className="text-xs px-2.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/80 font-mono font-bold">
                {account.mule_type} ({account.confidence}% Conf.)
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-100 font-mono tracking-tight">
              {account.customer?.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {account.flagged_reason}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono text-slate-300">
              <span>{account.bank_name}</span>
              <span>•</span>
              <span>Branch: {account.branch}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">KYC: {account.kyc_status}</span>
              <span>•</span>
              <span>Balance: ₹{account.balance?.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Trigger: Generate Investigation Brief */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={handleOpenBrief}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-slate-950 font-bold text-xs tracking-wide shadow-xl shadow-cyan-950/50 transition transform hover:-translate-y-0.5"
            >
              <FileText className="w-4 h-4 fill-current" />
              <span>Generate Investigation Brief</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs font-mono select-none">
        {[
          { key: "overview", label: "Threat Overview" },
          { key: "why_flagged", label: "Why Flagged (XAI)" },
          { key: "fingerprint", label: "Behavior Fingerprint" },
          { key: "money_trail", label: `Money Trail (${moneyTrail?.hops_count || 0})` },
          { key: "network", label: `Network Graph (${graphData?.elements?.length || 0})` },
          { key: "complaints", label: `Complaints (${complaints.length})` },
          { key: "notes", label: `Investigation Workspace` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-cyan-400 text-cyan-300 bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Threat Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Risk Engine 3-Component Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase font-mono font-bold text-slate-400">Behaviour Risk (40%)</span>
                <span className="font-mono font-bold text-red-400 text-sm">{account.behaviour_risk} / 100</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${account.behaviour_risk}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Velocity turnaround of {fingerprint.features.avg_receive_to_send_minutes}m and {intPercent(fingerprint.features.rapid_transfer_ratio)} rapid dispersal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase font-mono font-bold text-slate-400">Network Risk (35%)</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{account.network_risk} / 100</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${account.network_risk}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Direct association with {fingerprint.features.suspicious_neighbour_count} flagged counterparties in cluster {account.cluster_id || "NCL-101"}.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase font-mono font-bold text-slate-400">Complaint Risk (25%)</span>
                <span className="font-mono font-bold text-rose-500 text-sm">{account.complaint_risk} / 100</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${account.complaint_risk}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Matched to {account.complaints_count} formal victim fraud reports on NCRP.
              </p>
            </div>
          </div>

          {/* Money In vs Money Out Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Total Inbound Flow
                </span>
                <span className="font-mono font-bold text-cyan-400 text-lg">
                  ₹{account.inflow?.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Received across {fingerprint.features.inbound_count} incoming deposits from {fingerprint.features.unique_senders} unique senders.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  Total Outbound Flow
                </span>
                <span className="font-mono font-bold text-amber-400 text-lg">
                  ₹{account.outflow?.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dispersed across {fingerprint.features.outbound_count} outgoing transfers with {fingerprint.features.inflow_outflow_ratio}x flow ratio.
              </p>
            </div>
          </div>

          {/* Top Indicators Preview */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider mb-3">
              Key Threat Indicators
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fingerprint.top_indicators.map((ind, i) => (
                <div key={i} className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-200 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{ind}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Why Flagged (Explainable AI Attribution) */}
      {activeTab === "why_flagged" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200">
              Explainable AI (SHAP-Style Feature Attribution)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Transparent decomposition of how each calculated metric directly drove this account&apos;s threat classification.
            </p>
          </div>

          {/* Positive Contributors (Risk Drivers) */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-red-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Positive Risk Contributors (Elevating Threat Score)
            </h4>
            <div className="space-y-2">
              {fingerprint.positive_contributors.map((c, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-red-400 text-sm mt-0.5">
                      +{Math.round(c.impact)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs">{c.display_name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {c.formatted_value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                    </div>
                  </div>
                  <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, c.impact * 4)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Negative Contributors (Mitigating Factors) */}
          <div className="space-y-3 pt-3">
            <h4 className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Negative Risk Contributors (Mitigating Indicators)
            </h4>
            <div className="space-y-2">
              {fingerprint.negative_contributors.map((c, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                      {Math.round(c.impact)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs">{c.display_name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {c.formatted_value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                    </div>
                  </div>
                  <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.abs(c.impact) * 4)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Behavior Fingerprint (All 20+ features) */}
      {activeTab === "fingerprint" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200">
              Account Crime Behavioral Fingerprint
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Comprehensive mathematical behavioral vectors extracted across transaction streams and regulatory networks.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(fingerprint.features).map(([key, val]) => (
              <div key={key} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="font-mono font-bold text-slate-100 text-sm mt-1 block truncate">
                  {typeof val === "number" ? val.toLocaleString() : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Money Trail Engine */}
      {activeTab === "money_trail" && moneyTrail && (
        <MoneyTrailViewer trail={moneyTrail} />
      )}

      {/* Tab 5: Network Graph Topology */}
      {activeTab === "network" && graphData && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-mono font-bold uppercase text-slate-200">
                Syndicate Graph & Entity Resolution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-hop Cytoscape visualization bridging hardware fingerprints, mobile SIMs, complaints, and accounts.
              </p>
            </div>
          </div>
          <CytoscapeGraph elements={graphData.elements} height="600px" />
        </div>
      )}

      {/* Tab 6: Connected Complaints */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200">
              National Cyber Crime Reporting Portal (NCRP) Correlation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Victim incident reports officially designating this account as direct recipient of fraudulent inducements.
            </p>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="p-4 hover:bg-slate-800/30 transition">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-400 text-xs">{c.complaint_id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {c.fraud_type}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-red-300 text-sm">
                    ₹{c.amount?.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{c.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] font-mono text-slate-400">
                  <span>Victim: {c.victim_name}</span>
                  <span>•</span>
                  <span>Police Station: {c.police_station}</span>
                  <span>•</span>
                  <span>Reported: {new Date(c.reported_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Investigation Workspace & Notes */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3">
              Add Case Note / Audit Event
            </h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log investigative finding, freeze order status, or subpoena reference..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 outline-none h-24 font-sans"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save to Investigation Ledger</span>
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">
              Audit Notes Timeline ({notes.length})
            </h4>
            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span className="font-bold text-cyan-400">{n.author}</span>
                    <span>{n.time}</span>
                  </div>
                  <p className="text-slate-200">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Investigation Brief Modal */}
      {isBriefModalOpen && brief && (
        <InvestigationBriefModal brief={brief} onClose={() => setIsBriefModalOpen(false)} />
      )}
    </div>
  );
}

function intPercent(val: number) {
  return `${Math.round((val || 0) * 100)}%`;
}
