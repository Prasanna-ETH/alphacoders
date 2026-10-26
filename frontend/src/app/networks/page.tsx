"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { NetworkClusterItem, CytoscapeGraphResponse } from "@/types";
import { CytoscapeGraph } from "@/components/CytoscapeGraph";
import { Network, ShieldAlert, Layers, Building2, ChevronRight, FileWarning, ArrowRight } from "lucide-react";

export default function NetworksPage() {
  const [clusters, setClusters] = useState<NetworkClusterItem[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string>("NCL-101");
  const [graphData, setGraphData] = useState<CytoscapeGraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClusters() {
      try {
        const list = await api.getNetworks();
        setClusters(list);
        if (list.length > 0) {
          const firstId = list[0].cluster_id;
          setSelectedClusterId(firstId);
          const g = await api.getNetworkClusterGraph(firstId);
          setGraphData(g);
        }
      } catch (err) {
        console.error("Error loading clusters:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClusters();
  }, []);

  const handleSelectCluster = async (cid: string) => {
    setSelectedClusterId(cid);
    try {
      const g = await api.getNetworkClusterGraph(cid);
      setGraphData(g);
    } catch (err) {
      console.error("Failed to load cluster graph:", err);
    }
  };

  const selectedCluster = clusters.find((c) => c.cluster_id === selectedClusterId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
          <Network className="w-5 h-5 text-indigo-400" />
          Network Intelligence & Syndicate Clusters
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Identified criminal syndicates operating across shared hardware terminals, emulated devices, and common digital wallets
        </p>
      </div>

      {/* Cluster Cards Carousel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clusters.map((c) => {
          const isSelected = c.cluster_id === selectedClusterId;
          return (
            <div
              key={c.cluster_id}
              onClick={() => handleSelectCluster(c.cluster_id)}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-950/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-300">{c.cluster_id}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      c.risk_level === "CRITICAL"
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : "bg-amber-950 text-amber-300 border border-amber-800"
                    }`}
                  >
                    {c.risk_level}
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 text-xs font-mono">{c.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{c.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                <span>{c.account_count} accounts</span>
                <span>•</span>
                <span>₹{(c.total_flow / 100000).toFixed(1)}L flow</span>
                <span>•</span>
                <span className="text-red-400 font-medium">{c.complaint_count} FIRs</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Cluster Graph Visualization */}
      {selectedCluster && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400 uppercase">
                  Active Syndicate Topology:
                </span>
                <span className="font-mono text-xs font-bold text-slate-100">{selectedCluster.name}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cluster Type: {selectedCluster.cluster_type} • Direct hardware and transaction bridges
              </p>
            </div>
          </div>

          {graphData && <CytoscapeGraph elements={graphData.elements} height="600px" />}
        </div>
      )}
    </div>
  );
}
