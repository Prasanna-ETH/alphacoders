"use client";

import React, { useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import { CytoscapeElement } from "@/types";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Layers,
  X,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Phone,
  User,
  FileWarning,
  CreditCard
} from "lucide-react";
import Link from "next/link";

interface CytoscapeGraphProps {
  elements: CytoscapeElement[];
  onNodeSelect?: (nodeData: any) => void;
  height?: string;
  className?: string;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  elements,
  onNodeSelect,
  height = "550px",
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [layoutName, setLayoutName] = useState<string>("cose");

  useEffect(() => {
    if (!containerRef.current || !elements || elements.length === 0) return;

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements.map((el) => ({
        data: el.data,
        classes: el.classes || ""
      })),
      style: [
        // Base Node Style
        {
          selector: "node",
          style: {
            "label": "data(label)",
            "color": "#F1F5F9",
            "font-size": "10px",
            "font-family": "monospace",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "text-background-color": "#0B0F19",
            "text-background-opacity": 0.85,
            "text-background-padding": "2px",
            "text-background-shape": "roundrectangle",
            "background-color": "#334155",
            "border-width": 2,
            "border-color": "#64748B",
            "width": 36,
            "height": 36,
            "transition-property": "background-color, border-color, width, height",
            "transition-duration": 0.2
          }
        },
        // Node Types
        {
          selector: ".node-account",
          style: {
            "background-color": "#0284C7",
            "border-color": "#38BDF8",
            "shape": "ellipse"
          }
        },
        {
          selector: ".node-person",
          style: {
            "background-color": "#6366F1",
            "border-color": "#818CF8",
            "shape": "round-rectangle"
          }
        },
        {
          selector: ".node-device",
          style: {
            "background-color": "#E11D48",
            "border-color": "#FB7185",
            "shape": "diamond",
            "width": 32,
            "height": 32
          }
        },
        {
          selector: ".node-phone",
          style: {
            "background-color": "#D97706",
            "border-color": "#FBBF24",
            "shape": "triangle",
            "width": 32,
            "height": 32
          }
        },
        {
          selector: ".node-complaint",
          style: {
            "background-color": "#DC2626",
            "border-color": "#F87171",
            "shape": "hexagon",
            "width": 38,
            "height": 38
          }
        },
        {
          selector: ".node-upi",
          style: {
            "background-color": "#0D9488",
            "border-color": "#2DD4BF",
            "shape": "star"
          }
        },
        // Risk Levels Border Accent
        {
          selector: ".risk-critical",
          style: {
            "border-color": "#EF4444",
            "border-width": 3
          }
        },
        {
          selector: ".risk-high",
          style: {
            "border-color": "#F59E0B",
            "border-width": 3
          }
        },
        // Base Edge Style
        {
          selector: "edge",
          style: {
            "width": 1.5,
            "line-color": "#475569",
            "target-arrow-color": "#64748B",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "label": "data(label)",
            "font-size": "8px",
            "font-family": "monospace",
            "color": "#94A3B8",
            "text-background-color": "#090D16",
            "text-background-opacity": 0.8,
            "text-background-padding": "1px",
            "arrow-scale": 0.8
          }
        },
        // Edge Types
        {
          selector: ".edge-transfer",
          style: {
            "line-color": "#0284C7",
            "target-arrow-color": "#0284C7",
            "width": 2
          }
        },
        {
          selector: ".edge-suspicious",
          style: {
            "line-color": "#EF4444",
            "target-arrow-color": "#EF4444",
            "line-style": "dashed",
            "width": 2.5
          }
        },
        {
          selector: ".edge-shares_device, .edge-shares_phone",
          style: {
            "line-color": "#F59E0B",
            "target-arrow-color": "#F59E0B",
            "line-style": "dotted",
            "width": 2
          }
        },
        // Selected / Highlighted State
        {
          selector: ":selected",
          style: {
            "border-width": 4,
            "border-color": "#38BDF8",
            "overlay-color": "#38BDF8",
            "overlay-opacity": 0.3,
            "overlay-padding": 6
          } as any
        }
      ],
      layout: {
        name: layoutName,
        padding: 50,
        animate: true,
        animationDuration: 500
      } as any
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const data = node.data();
      setSelectedNode(data);
      if (onNodeSelect) onNodeSelect(data);

      // Highlight neighbors
      cy.elements().removeClass("dimmed");
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass("dimmed");
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        cy.elements().removeClass("dimmed");
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [elements, layoutName, onNodeSelect]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleResetLayout = () => {
    (cyRef.current?.layout({ name: layoutName, animate: true, animationDuration: 500 } as any) as any)?.run();
  };

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case "Account": return <CreditCard className="w-4 h-4 text-cyan-400" />;
      case "Person": return <User className="w-4 h-4 text-indigo-400" />;
      case "Device": return <Smartphone className="w-4 h-4 text-rose-400" />;
      case "Phone": return <Phone className="w-4 h-4 text-amber-400" />;
      case "Complaint": return <FileWarning className="w-4 h-4 text-red-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className={`relative w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl ${className}`}>
      {/* Canvas container */}
      <div ref={containerRef} style={{ height }} className="w-full bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Floating Graph Toolbar */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-lg backdrop-blur z-10 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          title="Fit View"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button
          onClick={() => setLayoutName(layoutName === "cose" ? "concentric" : layoutName === "concentric" ? "circle" : "cose")}
          title="Cycle Layout (CoSE / Concentric / Circle)"
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition font-mono"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase">{layoutName}</span>
        </button>
        <button
          onClick={handleResetLayout}
          title="Re-run Layout"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Graph Legend */}
      <div className="absolute bottom-3 left-3 p-2 bg-slate-900/85 border border-slate-800 rounded-lg backdrop-blur z-10 text-[10px] text-slate-300 flex items-center gap-3">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Account</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500" /> Person</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rotate-45 bg-rose-500" /> Device</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Phone</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-600" /> Complaint</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-red-500" /> Suspicious Flow</span>
      </div>

      {/* Right Investigation Slide-Out Panel */}
      {selectedNode && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-slate-900/95 border-l border-slate-800 p-5 backdrop-blur z-20 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {getNodeIcon(selectedNode.type)}
                <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                  {selectedNode.type} Node
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-base font-bold font-mono text-slate-100">{selectedNode.label}</h4>
              {selectedNode.subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{selectedNode.subtitle}</p>
              )}

              {selectedNode.risk_score !== undefined && (
                <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Risk Assessment</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      selectedNode.risk_score >= 80
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : selectedNode.risk_score >= 60
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-emerald-950 text-emerald-300"
                    }`}
                  >
                    {selectedNode.risk_score}/100 {selectedNode.risk_level}
                  </span>
                </div>
              )}

              {/* Dynamic Entity Metadata */}
              <div className="mt-4 space-y-2 text-xs">
                {selectedNode.details &&
                  Object.entries(selectedNode.details).map(([k, v]) => {
                    if (k === "subtitle") return null;
                    return (
                      <div key={k} className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400 capitalize">{k.replace("_", " ")}:</span>
                        <span className="font-mono text-slate-200 text-right truncate max-w-[150px]">
                          {String(v)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {selectedNode.type === "Account" && selectedNode.details?.account_id && (
            <div className="pt-4 border-t border-slate-800">
              <Link
                href={`/accounts/${selectedNode.details.account_id}`}
                className="flex items-center justify-center gap-2 w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition"
              >
                <span>Investigate Account</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
