"use client";

import React, { useState } from "react";
import { Sparkles, Search, ArrowRight, ShieldAlert, Check } from "lucide-react";
import { api } from "@/lib/api";
import { AccountSummary } from "@/types";
import Link from "next/link";
import { RiskBadge } from "./RiskBadge";

export const NLPSearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sampleQueries = [
    "Show high-risk pass-through mules",
    "Find accounts linked to multiple complaints",
    "Show accounts with rapid fund transfers",
    "Find suspicious networks with more than 5 accounts",
    "Find accounts sharing a device with a critical-risk account"
  ];

  const handleSearch = async (qText: string) => {
    if (!qText.trim()) return;
    setQuery(qText);
    setIsLoading(true);
    try {
      const res = await api.nlpSearch(qText);
      setResults(res);
    } catch (err) {
      console.error("NLP search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs uppercase font-mono font-bold text-slate-200 tracking-wider">
              Natural Language Investigation Query
            </h3>
            <p className="text-[11px] text-slate-400">
              Pattern parser translating natural questions into structured multi-entity risk rules
            </p>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show high-risk pass-through mules with multiple complaints..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 outline-none transition"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
        >
          <span>{isLoading ? "Querying..." : "Execute"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Try Queries:</span>
        {sampleQueries.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSearch(sq)}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 hover:border-cyan-500/50 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white transition font-sans"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Results Dropdown */}
      {results && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400">
              Matched Intent: <span className="text-white font-bold">{results.parsed_intent}</span>
            </span>
            <span className="text-slate-400">
              Found <span className="text-white font-bold">{results.total_matched}</span> accounts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {results.matched_accounts.map((acc: AccountSummary) => (
              <Link
                key={acc.account_id}
                href={`/accounts/${acc.account_id}`}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 flex items-center justify-between transition group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                      {acc.account_number}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">({acc.mule_type})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {acc.customer_name} • {acc.complaints_count} NCRP complaints
                  </div>
                </div>
                <RiskBadge score={acc.risk_score} level={acc.risk_level} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
