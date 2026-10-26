"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldAlert, Phone, Smartphone, FileWarning, ExternalLink, X, Zap } from "lucide-react";
import { api } from "@/lib/api";

export const Header: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.globalSearch(query.trim());
        setResults(res);
        setIsOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  };

  return (
    <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="relative w-full max-w-xl" ref={containerRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results && setIsOpen(true)}
            placeholder="Search account (e.g. ACC-2847), phone, device, UPI, complaint..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 outline-none transition font-sans"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults(null);
                setIsOpen(false);
              }}
              className="absolute right-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Instant Search Dropdown */}
        {isOpen && results && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50 divide-y divide-slate-800/60">
            {/* Accounts */}
            {results.accounts?.length > 0 && (
              <div className="p-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-cyan-400" />
                  <span>Target Accounts ({results.accounts.length})</span>
                </div>
                {results.accounts.map((acc: any) => (
                  <button
                    key={acc.account_id}
                    onClick={() => handleSelect(`/accounts/${acc.account_id}`)}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800/80 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-200">{acc.account_number}</span>
                      <span className="text-slate-400 ml-2">({acc.customer_name})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cyan-400 font-mono">{acc.mule_type}</span>
                      <span
                        className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          acc.risk_score >= 80 ? "bg-red-950 text-red-300 border border-red-800" : "bg-amber-950 text-amber-300"
                        }`}
                      >
                        {acc.risk_score}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Complaints */}
            {results.complaints?.length > 0 && (
              <div className="p-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center gap-1.5">
                  <FileWarning className="w-3 h-3 text-red-400" />
                  <span>NCRP Complaints ({results.complaints.length})</span>
                </div>
                {results.complaints.map((c: any) => (
                  <button
                    key={c.complaint_id}
                    onClick={() => handleSelect(`/complaints`)}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800/80 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-mono text-slate-300 font-semibold">{c.complaint_id}</span>
                      <span className="text-slate-400 ml-2">₹{c.amount?.toLocaleString()} ({c.fraud_type})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{c.victim_name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {(!results.accounts || results.accounts.length === 0) &&
              (!results.complaints || results.complaints.length === 0) &&
              (!results.phones || results.phones.length === 0) && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No direct entities matching &ldquo;{query}&rdquo;.
                </div>
              )}
          </div>
        )}
      </div>

      {/* Right Controls & Demo Badge */}
      <div className="flex items-center gap-3">
        {/* Quick jump to Demo ACC-2847 */}
        <button
          onClick={() => router.push("/accounts/ACC-2847")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold shadow-md shadow-red-950/40 hover:brightness-110 transition"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Demo Case: ACC-2847</span>
        </button>

        {/* Environment Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded border border-emerald-500/30 bg-emerald-950/40 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>DEMO / SYNTHETIC DATA</span>
        </div>
      </div>
    </header>
  );
};
