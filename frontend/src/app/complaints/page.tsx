"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ComplaintItem } from "@/types";
import { FileWarning, Search, Filter, ExternalLink, Calendar, MapPin, Building2, User } from "lucide-react";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [fraudType, setFraudType] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);

  const fraudTypes = [
    "UPI fraud",
    "Phishing",
    "Investment fraud",
    "Impersonation",
    "Marketplace fraud",
    "Loan scam",
    "Job scam"
  ];

  async function loadComplaints() {
    setIsLoading(true);
    try {
      const data = await api.getComplaints({
        fraud_type: fraudType || undefined,
        search: search.trim() || undefined,
        limit: 100
      });
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [fraudType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadComplaints();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
          <FileWarning className="w-5 h-5 text-red-500" />
          National Cybercrime Portal Complaints Ledger
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Direct incident FIR filings, police station jurisdictions, victim dispute amounts, and beneficiary account correlations
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search victim, station, ack number..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 outline-none"
            />
          </form>

          <select
            value={fraudType}
            onChange={(e) => setFraudType(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
          >
            <option value="">All Fraud Types</option>
            {fraudTypes.map((ft) => (
              <option key={ft} value={ft}>
                {ft}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table & Details side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 select-none">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Fraud Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Victim Name</th>
                  <th className="py-3 px-4">Beneficiary Account</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading complaints...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr
                      key={c.complaint_id}
                      onClick={() => setSelectedComplaint(c)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition ${
                        selectedComplaint?.complaint_id === c.complaint_id ? "bg-slate-800/80" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-red-400">{c.complaint_id}</td>
                      <td className="py-3 px-4 font-sans text-slate-200">{c.fraud_type}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-100">
                        ₹{c.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300">{c.victim_name}</td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/accounts/${c.linked_account_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 hover:underline"
                        >
                          {c.linked_account_number || c.linked_account_id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(c.reported_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Details Panel */}
        <div>
          {selectedComplaint ? (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase font-bold text-red-400">NCRP Incident File</span>
                <h3 className="text-base font-bold font-mono text-slate-100">{selectedComplaint.complaint_id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedComplaint.fraud_type}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono block">Disputed Fraud Flow</span>
                  <span className="font-mono text-lg font-bold text-red-400">
                    ₹{selectedComplaint.amount?.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono block">Victim Details</span>
                  <span className="font-sans font-semibold text-slate-200">{selectedComplaint.victim_name}</span>
                  <span className="text-slate-400 block">{selectedComplaint.victim_contact}</span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono block">Police Station Jurisdiction</span>
                  <span className="font-sans text-slate-300 block">{selectedComplaint.police_station}</span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono block">Acknowledgement No.</span>
                  <span className="font-mono text-cyan-400 block">{selectedComplaint.acknowledgement_no}</span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono block">Incident Summary</span>
                  <p className="font-sans text-slate-300 mt-1 leading-normal p-3 rounded-lg bg-slate-950 border border-slate-800">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/accounts/${selectedComplaint.linked_account_id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition"
                  >
                    <span>Investigate Recipient Account</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40 text-xs">
              Select any complaint from the ledger to view victim incident details and police jurisdiction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
