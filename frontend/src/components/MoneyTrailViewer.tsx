"use client";

import React from "react";
import { MoneyTrailResponse, MoneyTrailHop } from "@/types";
import {
  ArrowRight,
  Clock,
  ShieldAlert,
  FileWarning,
  Layers,
  TrendingDown,
  Building2,
  Calendar,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

interface MoneyTrailViewerProps {
  trail: MoneyTrailResponse;
  isLoading?: boolean;
}

export const MoneyTrailViewer: React.FC<MoneyTrailViewerProps> = ({ trail, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span>Reconstructing multi-hop money trail...</span>
      </div>
    );
  }

  if (!trail || !trail.hops || trail.hops.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-xl bg-slate-900/40 text-xs">
        No money trail transactions match the selected filters.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Tracked Flow</span>
          </div>
          <p className="text-lg font-mono font-bold text-slate-100">
            ₹{trail.total_flow_amount?.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Reconstructed Layers</span>
          </div>
          <p className="text-lg font-mono font-bold text-slate-100">
            {trail.hops_count} <span className="text-xs font-normal text-slate-400">hops</span>
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Entities Involved</span>
          </div>
          <p className="text-lg font-mono font-bold text-slate-100">
            {trail.unique_accounts_count} <span className="text-xs font-normal text-slate-400">accounts</span>
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Velocity Duration</span>
          </div>
          <p className="text-lg font-mono font-bold text-slate-100">
            {trail.total_duration_minutes} <span className="text-xs font-normal text-slate-400">minutes</span>
          </p>
        </div>
      </div>

      {/* Visual Step-by-Step Chain */}
      <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
        {trail.hops.map((hop, index) => {
          const isRapid = hop.time_elapsed_minutes !== null && hop.time_elapsed_minutes !== undefined && hop.time_elapsed_minutes <= 15.0;

          return (
            <div key={`${hop.source_account_id}-${hop.target_account_id}-${index}`} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-mono font-bold ${
                  hop.is_complaint_linked
                    ? "bg-red-500 border-red-300 text-white shadow-lg shadow-red-900/50"
                    : isRapid
                    ? "bg-amber-500 border-amber-300 text-slate-950"
                    : "bg-slate-800 border-cyan-400 text-cyan-300"
                }`}
              >
                {hop.hop_number}
              </div>

              {/* Hop Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-800/40">
                      Layer {hop.hop_number} Hop
                    </span>
                    <span className="text-xs font-mono text-slate-400">{hop.channel}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    {hop.time_elapsed_minutes !== null && hop.time_elapsed_minutes !== undefined && (
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                          isRapid ? "bg-red-950 text-red-300 border border-red-800 animate-pulse" : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {hop.time_elapsed_minutes}m turnaround
                      </span>
                    )}

                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(hop.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Sender -> Receiver Flow Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                  {/* Sender */}
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Originating Account</div>
                    <Link
                      href={`/accounts/${hop.source_account_id}`}
                      className="font-mono text-xs font-bold text-cyan-400 hover:underline block truncate"
                    >
                      {hop.source_account_number}
                    </Link>
                  </div>

                  {/* Flow Amount & Direction */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-base font-mono font-bold text-slate-100">
                      ₹{hop.amount?.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-cyan-400 mt-0.5">
                      <span className="h-0.5 w-8 bg-cyan-500/50" />
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>

                  {/* Receiver */}
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Recipient Account</div>
                    <Link
                      href={`/accounts/${hop.target_account_id}`}
                      className="font-mono text-xs font-bold text-cyan-400 hover:underline block truncate"
                    >
                      {hop.target_account_number}
                    </Link>
                  </div>
                </div>

                {/* Complaint Correlation Banner if linked */}
                {hop.is_complaint_linked && (
                  <div className="mt-3 p-2 rounded bg-red-950/50 border border-red-800/50 flex items-center justify-between text-xs text-red-300">
                    <div className="flex items-center gap-1.5">
                      <FileWarning className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Direct victim dispute matched to transaction: {hop.complaint_ids.join(", ")}</span>
                    </div>
                    <Link href="/complaints" className="underline text-[11px] hover:text-red-200">
                      View FIR
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
