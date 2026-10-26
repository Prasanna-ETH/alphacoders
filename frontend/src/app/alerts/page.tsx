"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AlertItem } from "@/types";
import { BellRing, Check, X, ShieldAlert, ArrowRight, ExternalLink, Clock } from "lucide-react";

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadAlerts() {
    setIsLoading(true);
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: string, status: string) => {
    try {
      await api.updateAlertStatus(alertId, status);
      setAlerts(
        alerts.map((a) => (a.alert_id === alertId ? { ...a, status: status.toUpperCase() } : a))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
          <BellRing className="w-5 h-5 text-amber-400" />
          Real-Time Automated Fraud Alerts
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          High-velocity anomaly detection triggers, wash flow patterns, and hardware collision notifications
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 select-none">
              <tr>
                <th className="py-3 px-4">Alert Typology</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Target Account</th>
                <th className="py-3 px-4">Trigger Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading telemetry alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    Zero active alerts requiring triage.
                  </td>
                </tr>
              ) : (
                alerts.map((al) => (
                  <tr key={al.alert_id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{al.alert_type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          al.severity === "CRITICAL"
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {al.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/accounts/${al.account_id}`}
                        className="font-bold text-cyan-400 hover:underline"
                      >
                        {al.account_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-md truncate">
                      {al.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {al.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => router.push(`/accounts/${al.account_id}`)}
                          className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/50 text-cyan-300 text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(al.alert_id, "REVIEWED")}
                          title="Mark Reviewed"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(al.alert_id, "DISMISSED")}
                          title="Dismiss"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
