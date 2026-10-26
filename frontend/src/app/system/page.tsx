"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { SystemHealthResponse } from "@/types";
import {
  Activity,
  CheckCircle2,
  Database,
  Cpu,
  Network,
  RotateCcw,
  ShieldCheck,
  Server,
  Layers,
  Sparkles
} from "lucide-react";

export default function SystemPage() {
  const [stats, setStats] = useState<SystemHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReseeding, setIsReseeding] = useState(false);

  async function loadStats() {
    setIsLoading(true);
    try {
      const data = await api.getSystemStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load system stats:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const handleReseed = async () => {
    if (!confirm("Reseed synthetic database with deterministic baseline accounts and scenario data?")) return;
    setIsReseeding(true);
    try {
      await api.reseedDatabase();
      await loadStats();
      alert("Database reseeded successfully.");
    } catch (err) {
      console.error("Reseed failed:", err);
    } finally {
      setIsReseeding(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-xs text-slate-400 gap-3">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span>Querying system microservice telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            System Architecture & Model Performance Diagnostics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Engine runtimes, database health, in-memory graph topologies, and empirical ML validation metrics
          </p>
        </div>

        <button
          onClick={handleReseed}
          disabled={isReseeding}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-mono rounded-lg transition"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-cyan-400 ${isReseeding ? "animate-spin" : ""}`} />
          <span>{isReseeding ? "Reseeding Database..." : "Reseed Baseline Dataset"}</span>
        </button>
      </div>

      {/* Subsystem Operational Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" />
              REST API Server
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs font-mono font-bold text-slate-100">{stats.api_status}</p>
          <span className="text-[10px] text-slate-500 font-mono">FastAPI / Uvicorn ASGI</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              Database Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <p className="text-xs font-mono font-bold text-slate-100">{stats.database_status}</p>
          <span className="text-[10px] text-slate-500 font-mono">SQLAlchemy ORM + SQLite WAL</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              ML Threat Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          </div>
          <p className="text-xs font-mono font-bold text-slate-100">{stats.ml_engine_status}</p>
          <span className="text-[10px] text-slate-500 font-mono">Model: {stats.model_version}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Network className="w-4 h-4 text-rose-400" />
              Graph Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
          <p className="text-xs font-mono font-bold text-slate-100">{stats.graph_engine_status}</p>
          <span className="text-[10px] text-slate-500 font-mono">Neo4j Compatible Layer</span>
        </div>
      </div>

      {/* Actual Calculated ML Validation Metrics */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Empirical ML Model Validation Metrics (Calculated on Synthetic Dataset)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Trained on multi-modal behavioral vectors with out-of-fold cross validation (no fabricated values)
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            {stats.model_version}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Accuracy</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">
              {(stats.validation_metrics.accuracy * 100).toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">ROC-AUC Score</span>
            <span className="text-2xl font-mono font-bold text-cyan-400">
              {stats.validation_metrics.roc_auc.toFixed(3)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Precision</span>
            <span className="text-2xl font-mono font-bold text-indigo-400">
              {(stats.validation_metrics.precision * 100).toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Recall</span>
            <span className="text-2xl font-mono font-bold text-amber-400">
              {(stats.validation_metrics.recall * 100).toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">F1 Score</span>
            <span className="text-2xl font-mono font-bold text-rose-400">
              {(stats.validation_metrics.f1_score * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Ingestion & Telemetry Record Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Ledger Accounts</span>
          <span className="text-xl font-mono font-bold text-slate-100 mt-1 block">
            {stats.total_accounts.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Ingested Transactions</span>
          <span className="text-xl font-mono font-bold text-slate-100 mt-1 block">
            {stats.total_transactions.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Customer Identities</span>
          <span className="text-xl font-mono font-bold text-slate-100 mt-1 block">
            {stats.total_customers.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">NCRP Incident Reports</span>
          <span className="text-xl font-mono font-bold text-slate-100 mt-1 block">
            {stats.total_complaints.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
