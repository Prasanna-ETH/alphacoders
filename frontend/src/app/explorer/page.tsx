"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { HiddenLinksResponse, HiddenConnectionPath } from "@/types";
import { Database, Search, GitCompare, ArrowRight, ShieldAlert, Smartphone, Phone, CreditCard, ChevronRight } from "lucide-react";

export default function ExplorerPage() {
  const [sourceEntity, setSourceEntity] = useState("ACC-2847");
  const [targetEntity, setTargetEntity] = useState("ACC-7721");
  const [hiddenLinks, setHiddenLinks] = useState<HiddenLinksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const samplePairs = [
    { src: "ACC-2847", tgt: "ACC-7721", label: "ACC-2847 and ACC-7721 (Shared Hardware FP-MUM-AND-8891-X17)" },
    { src: "ACC-2847", tgt: "ACC-1029", label: "ACC-2847 and ACC-1029 (Multi-hop Layering Bridge)" },
    { src: "ACC-3101", tgt: "ACC-3106", label: "ACC-3101 and ACC-3106 (Syndicate Wash Trading Cluster)" }
  ];

  const handleDiscover = async (s: string = sourceEntity, t: string = targetEntity) => {
    if (!s.trim() || !t.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.getHiddenLinks(s.trim(), t.trim());
      setHiddenLinks(res);
    } catch (err) {
      console.error("Hidden link discovery failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
          <Database className="w-5 h-5 text-cyan-400" />
          Financial Crime Intelligence Explorer & Hidden Link Discovery
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Uncovering hidden multi-hop infrastructure links, shared hardware fingerprints, telecom bridges, and common beneficiaries
        </p>
      </div>

      {/* Hidden Links Investigation Tool */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold uppercase text-slate-200 tracking-wider">
            Find Hidden Entity Connections
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Entity A (Account / Complaint)</label>
            <input
              type="text"
              value={sourceEntity}
              onChange={(e) => setSourceEntity(e.target.value)}
              placeholder="e.g. ACC-2847"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-100 font-mono outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Entity B (Account / Complaint)</label>
            <input
              type="text"
              value={targetEntity}
              onChange={(e) => setTargetEntity(e.target.value)}
              placeholder="e.g. ACC-7721"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-100 font-mono outline-none"
            />
          </div>

          <div>
            <button
              onClick={() => handleDiscover(sourceEntity, targetEntity)}
              disabled={isLoading}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition font-mono"
            >
              {isLoading ? "Searching..." : "Trace Links"}
            </button>
          </div>
        </div>

        {/* Preset sample pairs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          <span className="text-slate-500 font-mono uppercase text-[10px]">Test Collusions:</span>
          {samplePairs.map((pair, i) => (
            <button
              key={i}
              onClick={() => {
                setSourceEntity(pair.src);
                setTargetEntity(pair.tgt);
                handleDiscover(pair.src, pair.tgt);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans transition border border-slate-700"
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden Links Discovery Results */}
      {hiddenLinks && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold">
              Potential Hidden Connections Detected ({hiddenLinks.total_found})
            </span>
          </div>

          {hiddenLinks.total_found === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-xl bg-slate-900/40 text-xs">
              No direct or secondary hardware/telecom bridges detected between these two entities.
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenLinks.paths.map((p, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-red-400 uppercase">
                      {p.connection_type.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        p.risk_level === "CRITICAL"
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : "bg-amber-950 text-amber-300"
                      }`}
                    >
                      {p.risk_level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200">{p.explanation}</p>

                  {/* Multi-step Visual Bridge */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-2 text-xs font-mono">
                    {p.path.map((step, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <div className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-cyan-400">[{step.type}]</span>
                          <span className="text-slate-200">{step.label}</span>
                        </div>
                        {sIdx < p.path.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
