"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { InvestigationDetail } from "@/types";
import { Briefcase, Plus, FileText, Send, CheckCircle2, ShieldAlert, Clock, User, ChevronRight } from "lucide-react";

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<InvestigationDetail[]>([]);
  const [selectedCase, setSelectedCase] = useState<InvestigationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Case Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAccountId, setNewAccountId] = useState("ACC-2847");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("CRITICAL");

  // New Note
  const [noteText, setNoteText] = useState("");

  async function loadInvestigations() {
    setIsLoading(true);
    try {
      const data = await api.getInvestigations();
      setInvestigations(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    } catch (err) {
      console.error("Error loading investigations:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInvestigations();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createInvestigation({
        subject_account_id: newAccountId,
        title: newTitle || undefined,
        priority: newPriority
      });
      setIsCreateOpen(false);
      setNewTitle("");
      await loadInvestigations();
      setSelectedCase(created);
    } catch (err) {
      console.error("Failed to create case:", err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !noteText.trim()) return;
    try {
      await api.addInvestigationNote(selectedCase.investigation_id, noteText.trim());
      setNoteText("");
      // Refresh case
      const updated = await api.getInvestigation(selectedCase.investigation_id);
      setSelectedCase(updated);
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            Cybercrime Investigation Case Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active intelligence dossiers, formal audit trails, evidence catalogs, and multi-agency coordination
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Initialize New Case</span>
        </button>
      </div>

      {/* Main Grid: Cases List (Left) & Case Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-400">
            Active Investigation Files ({investigations.length})
          </h3>
          <div className="space-y-2">
            {investigations.map((inv) => {
              const isSelected = selectedCase?.investigation_id === inv.investigation_id;
              return (
                <div
                  key={inv.investigation_id}
                  onClick={() => setSelectedCase(inv)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/30"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-cyan-400">{inv.case_number}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        inv.priority === "CRITICAL"
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : "bg-amber-950 text-amber-300"
                      }`}
                    >
                      {inv.priority}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs font-mono line-clamp-1">{inv.title}</h4>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <span>Target: {inv.subject_account_number}</span>
                    <span className="text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Case Workspace Details */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              {/* Case Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-cyan-400">{selectedCase.case_number}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      STATUS: {selectedCase.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 font-mono">{selectedCase.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">Lead Investigator: {selectedCase.investigator_name}</p>
                </div>

                <Link
                  href={`/accounts/${selectedCase.subject_account_id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition font-mono self-start"
                >
                  <span>Open Target Account</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </Link>
              </div>

              {/* Case Summary */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono font-bold text-slate-400">Executive Case Brief</span>
                <p className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-normal">
                  {selectedCase.summary}
                </p>
              </div>

              {/* Evidence Registry */}
              <div className="space-y-3">
                <span className="text-xs uppercase font-mono font-bold text-slate-400">
                  Bookmarked Forensic Evidence ({selectedCase.evidence_items.length})
                </span>
                <div className="space-y-2">
                  {selectedCase.evidence_items.map((ev) => (
                    <div key={ev.evidence_id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-cyan-400 text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                          {ev.evidence_type}
                        </span>
                        <span className="font-mono text-slate-400">{ev.entity_id}</span>
                      </div>
                      <p className="text-slate-300">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Notes & Audit */}
              <div className="space-y-4 pt-2">
                <span className="text-xs uppercase font-mono font-bold text-slate-400">
                  Case Activity Log ({selectedCase.notes.length})
                </span>

                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log investigative action, suspect interview, or bank lien confirmation..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 outline-none h-20"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Append Note</span>
                  </button>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedCase.notes.map((n) => (
                    <div key={n.note_id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span className="text-cyan-400 font-bold">{n.author}</span>
                        <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-200">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/40 text-xs">
              Select an investigation file to inspect case intelligence.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Initialize New Case */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-100">
              Initialize Investigation Case
            </h3>
            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Subject Account ID</label>
                <input
                  type="text"
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  placeholder="e.g. ACC-2847"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Case Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Pass-Through Mule Syndicate Investigation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold"
                >
                  Open Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
