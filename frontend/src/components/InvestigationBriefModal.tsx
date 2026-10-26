"use client";

import React, { useState } from "react";
import { InvestigationBrief } from "@/types";
import { api } from "@/lib/api";
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight
} from "lucide-react";

interface InvestigationBriefModalProps {
  brief: InvestigationBrief;
  onClose: () => void;
}

export const InvestigationBriefModal: React.FC<InvestigationBriefModalProps> = ({ brief, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const url = api.getPdfBriefUrl(brief.case_id);
      window.open(url, "_blank");
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 font-mono text-sm">
                  {brief.case_id}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                  {brief.risk_score}/100 {brief.risk_level}
                </span>
              </div>
              <p className="text-xs text-slate-400">Formal Financial Crime Intelligence Brief</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-900/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Generating..." : "Download Official PDF"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-300 font-sans text-xs leading-relaxed">
          {/* Target Metadata Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Subject Account</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{brief.subject_account}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Account Holder</span>
              <span className="font-semibold text-slate-200 text-sm truncate block">{brief.account_holder}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Classified Typology</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{brief.mule_type}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Algorithm Confidence</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">{brief.confidence}%</span>
            </div>
          </div>

          {/* 1. Executive Summary */}
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-cyan-400 rounded-sm" />
              1. Executive Summary
            </h4>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300 leading-normal">
              {brief.executive_summary}
            </div>
          </div>

          {/* 2. Key Investigative Findings */}
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-400 rounded-sm" />
              2. Key Investigative Findings
            </h4>
            <div className="space-y-2">
              {brief.key_findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Risk Engine Breakdown */}
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-red-400 rounded-sm" />
              3. Algorithmic Risk Contributors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {brief.risk_contributors.map((r, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 font-mono text-xs text-red-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Money Trail Reconstruction */}
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-indigo-400 rounded-sm" />
              4. Money Trail Diversion Analysis
            </h4>
            <p className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300">
              {brief.money_trail_summary}
            </p>
          </div>

          {/* 5. Connected NCRP Complaints */}
          {brief.connected_complaints.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-rose-500 rounded-sm" />
                5. Connected National Cybercrime Portal Reports ({brief.connected_complaints.length})
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Complaint ID</th>
                      <th className="p-2.5">Fraud Type</th>
                      <th className="p-2.5">Disputed Amount</th>
                      <th className="p-2.5">Reported Date</th>
                      <th className="p-2.5">Victim Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {brief.connected_complaints.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-cyan-300">{c.complaint_id}</td>
                        <td className="p-2.5 text-slate-200">{c.fraud_type}</td>
                        <td className="p-2.5 font-bold text-red-300">₹{c.amount?.toLocaleString()}</td>
                        <td className="p-2.5 text-slate-400">{c.reported_date}</td>
                        <td className="p-2.5 text-slate-300">{c.victim}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Recommended Leads */}
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-emerald-400 rounded-sm" />
              6. Recommended Operational Actions
            </h4>
            <div className="space-y-2">
              {brief.investigation_leads.map((l, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 flex items-start gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-xs shrink-0">[LEAD #{i+1}]</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 italic">
            <Lock className="w-3 h-3 text-slate-400 inline mr-1" />
            {brief.compliance_disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
