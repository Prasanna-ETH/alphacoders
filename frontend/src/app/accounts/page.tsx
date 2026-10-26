"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AccountSummary } from "@/types";
import { RiskBadge } from "@/components/RiskBadge";
import {
  Search,
  Filter,
  ShieldAlert,
  ArrowUpDown,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  FileWarning
} from "lucide-react";

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [muleType, setMuleType] = useState<string>("");
  const [complaintLinked, setComplaintLinked] = useState<boolean>(false);
  const [minRisk, setMinRisk] = useState<number>(0);

  const muleTypes = [
    "PASS-THROUGH MULE",
    "FUNNEL MULE",
    "LAYERING MULE",
    "DISTRIBUTOR MULE",
    "DORMANT ACTIVATION",
    "CASH-OUT MULE",
    "NETWORK INTERMEDIARY",
    "NORMAL"
  ];

  async function loadAccounts() {
    setIsLoading(true);
    try {
      const data = await api.getAccounts({
        risk_level: riskLevel || undefined,
        mule_type: muleType || undefined,
        min_risk: minRisk > 0 ? minRisk : undefined,
        complaint_linked: complaintLinked || undefined,
        search: search.trim() || undefined,
        limit: 100
      });
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, [riskLevel, muleType, complaintLinked, minRisk]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAccounts();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Monitored Accounts Risk Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time behavioral scoring, mule typology classifications, and counterparty volumes
          </p>
        </div>

        <button
          onClick={loadAccounts}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs transition self-start sm:self-auto font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account / customer..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 outline-none"
            />
          </form>

          {/* Risk Level Filter */}
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL (&ge; 80)</option>
            <option value="HIGH">HIGH (60 - 79)</option>
            <option value="MEDIUM">MEDIUM (30 - 59)</option>
            <option value="LOW">LOW (0 - 29)</option>
          </select>

          {/* Mule Typology Filter */}
          <select
            value={muleType}
            onChange={(e) => setMuleType(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
          >
            <option value="">All Mule Typologies</option>
            {muleTypes.map((mt) => (
              <option key={mt} value={mt}>
                {mt}
              </option>
            ))}
          </select>

          {/* Complaint Linked Toggle */}
          <button
            type="button"
            onClick={() => setComplaintLinked(!complaintLinked)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
              complaintLinked
                ? "bg-red-950/80 border-red-500/80 text-red-200"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileWarning className="w-3.5 h-3.5" />
            <span>Complaint Linked Only</span>
          </button>
        </div>
      </div>

      {/* Accounts Data Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 select-none">
              <tr>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Account Holder</th>
                <th className="py-3 px-4">Bank / Branch</th>
                <th className="py-3 px-4">Threat Risk</th>
                <th className="py-3 px-4">Mule Typology</th>
                <th className="py-3 px-4 text-right">Inflow Volume</th>
                <th className="py-3 px-4 text-right">Outflow Volume</th>
                <th className="py-3 px-4 text-center">NCRP Complaints</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading accounts risk database...</span>
                    </div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    No accounts found matching active criteria.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr
                    key={acc.account_id}
                    onClick={() => router.push(`/accounts/${acc.account_id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4 font-bold text-slate-100 group-hover:text-cyan-400">
                      {acc.account_number}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200">{acc.customer_name}</td>
                    <td className="py-3 px-4 font-sans text-slate-400">{acc.bank_name}</td>
                    <td className="py-3 px-4">
                      <RiskBadge score={acc.risk_score} level={acc.risk_level} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {acc.mule_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-200">
                      ₹{acc.inflow?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-300">
                      ₹{acc.outflow?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {acc.complaints_count > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-400 bg-red-950/60 border border-red-900/60 px-2 py-0.5 rounded-full text-[10px]">
                          <FileWarning className="w-3 h-3" />
                          {acc.complaints_count}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/accounts/${acc.account_id}`);
                        }}
                        className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-800/40 transition"
                        title="Open Investigation"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
