"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DashboardSummaryResponse, AccountSummary } from "@/types";
import { RiskBadge } from "@/components/RiskBadge";
import { NLPSearchBar } from "@/components/NLPSearchBar";
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  FileWarning,
  Building2,
  Activity,
  Zap,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await api.getDashboardSummary();
        setData(res);
      } catch (err) {
        console.error("Failed to load dashboard summary:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-xs text-slate-400 gap-3">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span>Synthesizing financial crime intelligence telemetry...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        Backend disconnected. Please ensure FastAPI server is running on port 8000.
      </div>
    );
  }

  const COLORS = ["#EF4444", "#F59E0B", "#EAB308", "#10B981"];
  const pieData = Object.entries(data.risk_distribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  const fraudPieData = Object.entries(data.fraud_category_distribution || {}).map(([name, value]) => ({
    name,
    value
  }));
  const FRAUD_COLORS = ["#0284C7", "#6366F1", "#EC4899", "#8B5CF6", "#F97316", "#14B8A6", "#E11D48"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Hero Case Quick Launcher */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-500/40 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Critical Threat Escalate
              </span>
              <span className="text-xs text-slate-400 font-mono">Case Target: ACC-2847</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight font-sans">
              High-Velocity Pass-Through Mule Syndicate Detected
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Target account <span className="font-mono text-red-300 font-bold">ACC-2847</span> exhibits rapid 6-minute fund dispersal across ₹3.2L in victim credits with 6 active NCRP complaints and shared device collusion.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => router.push("/accounts/ACC-2847")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 text-white font-bold text-xs tracking-wide shadow-xl shadow-red-950/50 transition transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Investigate ACC-2847 (2-Min Demo)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-mono font-medium block">Monitored Accounts</span>
          <span className="text-2xl font-mono font-bold text-slate-100 mt-1 block">
            {data.total_monitored_accounts?.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" /> Real-time active
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-red-900/40 bg-red-950/10">
          <span className="text-[11px] text-red-300 uppercase font-mono font-medium block">Critical Accounts</span>
          <span className="text-2xl font-mono font-bold text-red-400 mt-1 block">
            {data.critical_accounts_count}
          </span>
          <span className="text-[10px] text-red-400 font-mono mt-1 block">Risk Score &ge; 80</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-900/40 bg-amber-950/10">
          <span className="text-[11px] text-amber-300 uppercase font-mono font-medium block">High-Risk Accounts</span>
          <span className="text-2xl font-mono font-bold text-amber-400 mt-1 block">
            {data.high_risk_accounts_count}
          </span>
          <span className="text-[10px] text-amber-400 font-mono mt-1 block">Risk 60 - 79</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-mono font-medium block">Suspicious Flow</span>
          <span className="text-2xl font-mono font-bold text-slate-100 mt-1 block">
            ₹{(data.total_suspicious_flow / 100000).toFixed(1)}L
          </span>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Illicit throughput</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-mono font-medium block">Complaint Linked</span>
          <span className="text-2xl font-mono font-bold text-slate-100 mt-1 block">
            {data.complaint_linked_accounts_count}
          </span>
          <span className="text-[10px] text-rose-400 font-mono mt-1 block">NCRP correlated</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-mono font-medium block">Syndicate Clusters</span>
          <span className="text-2xl font-mono font-bold text-slate-100 mt-1 block">
            {data.detected_network_clusters_count}
          </span>
          <span className="text-[10px] text-indigo-400 font-mono mt-1 block">Hardware bridges</span>
        </div>
      </div>

      {/* NLP Investigation Search Bar */}
      <NLPSearchBar />

      {/* Main Grid: Priority Queue (Left) & Visual Trends (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Investigation Queue (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold font-mono uppercase text-slate-100 tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Priority Investigation Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top high-velocity targets ranked by multi-modal threat scores</p>
            </div>
            <Link
              href="/accounts"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
            >
              <span>View All Accounts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-800/60">
            {data.priority_queue.map((acc, index) => (
              <div
                key={acc.account_id}
                onClick={() => router.push(`/accounts/${acc.account_id}`)}
                className="py-3 px-3 hover:bg-slate-800/50 rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-xs font-mono font-bold text-slate-400">{index + 1}.</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100 group-hover:text-cyan-400 transition">
                        {acc.account_id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({acc.account_number})</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {acc.mule_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{acc.customer_name}</span>
                      <span>•</span>
                      <span>{acc.bank_name}</span>
                      <span>•</span>
                      <span className="text-red-400 font-medium">{acc.complaints_count} complaints</span>
                      <span>•</span>
                      <span>₹{(acc.inflow / 100000).toFixed(1)}L flow</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <RiskBadge score={acc.risk_score} level={acc.risk_level} size="md" />
                  <span className="text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Charts: Risk Breakdown & Fraud Categories */}
        <div className="space-y-6">
          {/* Risk Level Distribution Chart */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-300 tracking-wider mb-3">
              Risk Level Population
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono">
              {pieData.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {p.name}
                  </span>
                  <span className="font-bold text-slate-200">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Category Distribution */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-300 tracking-wider mb-3">
              Cybercrime Complaint Categories
            </h3>
            <div className="space-y-2 text-xs">
              {fraudPieData.map((f, i) => (
                <div key={f.name} className="flex items-center justify-between py-1">
                  <span className="text-slate-400 truncate max-w-[170px]">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, f.value * 15)}%`,
                          backgroundColor: FRAUD_COLORS[i % FRAUD_COLORS.length]
                        }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-300 w-6 text-right">{f.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suspicious Flow Trend Area Chart */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs uppercase font-mono font-bold text-slate-200 tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              Suspicious Flow Volume Velocity Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">7-day aggregated illicit throughput detected across monitored syndicates</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded">
            Live Stream
          </span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.suspicious_flow_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Flagged Amount"]}
              />
              <Area type="monotone" dataKey="amount" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#flowGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
