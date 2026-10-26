"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { MoneyTrailResponse, AccountSummary } from "@/types";
import { MoneyTrailViewer } from "@/components/MoneyTrailViewer";
import { GitFork, Search, Filter, Sliders, ArrowRight } from "lucide-react";

export default function MoneyTrailsPage() {
  const [targetAccount, setTargetAccount] = useState("ACC-2847");
  const [direction, setDirection] = useState("BOTH");
  const [depth, setDepth] = useState(4);
  const [minAmount, setMinAmount] = useState(0);
  const [trail, setTrail] = useState<MoneyTrailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const candidateAccounts = [
    { id: "ACC-2847", label: "ACC-2847 (Pass-Through Mule - Flagship)" },
    { id: "ACC-7721", label: "ACC-7721 (Layering Mule - Layer 1)" },
    { id: "ACC-1029", label: "ACC-1029 (Funnel Mule - Layer 2)" },
    { id: "ACC-3106", label: "ACC-3106 (Circular Wash Flow)" },
    { id: "ACC-3107", label: "ACC-3107 (Distributor Mule Fan-Out)" },
    { id: "ACC-3103", label: "ACC-3103 (Dormant Activation Burst)" }
  ];

  async function loadTrail(accId: string = targetAccount) {
    setIsLoading(true);
    try {
      const res = await api.getMoneyTrail(accId, {
        direction,
        depth,
        min_amount: minAmount > 0 ? minAmount : undefined
      });
      setTrail(res);
    } catch (err) {
      console.error("Failed to trace trail:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTrail(targetAccount);
  }, [direction, depth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTrail(targetAccount);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
          <GitFork className="w-5 h-5 text-cyan-400" />
          Money Trail Reconstruction Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Recursive multi-hop tracing across transaction chains, layers, elapsed turnaround velocity, and beneficiary endpoints
        </p>
      </div>

      {/* Filter and Target Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Target Account Input / Quick Dropdown */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Target Account</label>
            <select
              value={targetAccount}
              onChange={(e) => {
                setTargetAccount(e.target.value);
                loadTrail(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
            >
              {candidateAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Flow Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
            >
              <option value="BOTH">Bidirectional (IN + OUT)</option>
              <option value="OUTBOUND">Dispersal Outbound Only</option>
              <option value="INBOUND">Inflow Origin Sources Only</option>
            </select>
          </div>

          {/* Depth Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Reconstruction Depth</label>
              <span className="text-xs font-mono font-bold text-cyan-400">{depth} Layers</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Execute button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition font-mono"
            >
              {isLoading ? "Reconstructing..." : "Reconstruct Trail"}
            </button>
          </div>
        </form>
      </div>

      {/* Trail Display */}
      {trail && <MoneyTrailViewer trail={trail} isLoading={isLoading} />}
    </div>
  );
}
