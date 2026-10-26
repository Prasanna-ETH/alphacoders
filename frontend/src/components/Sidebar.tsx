"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  GitFork,
  Network,
  FileWarning,
  Briefcase,
  BellRing,
  Database,
  Activity,
  Terminal,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Risk Accounts", href: "/accounts", icon: ShieldAlert, badge: "Priority" },
    { label: "Money Trails", href: "/money-trails", icon: GitFork },
    { label: "Network Intelligence", href: "/networks", icon: Network },
    { label: "Complaints", href: "/complaints", icon: FileWarning },
    { label: "Investigations", href: "/investigations", icon: Briefcase },
    { label: "Alerts", href: "/alerts", icon: BellRing, alertCount: "6" },
    { label: "Data Explorer", href: "/explorer", icon: Database },
    { label: "System Health", href: "/system", icon: Activity },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-20">
      {/* Top Logo */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30">
              <span className="font-mono font-black text-slate-950 text-xl tracking-tighter">M</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-slate-100 text-lg font-mono">MULEX</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  Intel
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight font-sans">Financial Crime Platform</p>
            </div>
          </Link>
        </div>

        {/* Demo Hero Launcher Quick Banner */}
        <div className="p-3 mx-3 mt-3 rounded-lg bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-900 border border-red-500/30">
          <div className="flex items-center justify-between text-[11px] font-semibold text-red-300 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              DEMO CASE ACTIVE
            </span>
            <span className="font-mono text-red-400 font-bold">91 RISK</span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2 leading-tight">
            Flagship pass-through syndicate <span className="font-mono text-red-200 font-bold">ACC-2847</span> (6 NCRP cases).
          </p>
          <Link
            href="/accounts/ACC-2847"
            className="flex items-center justify-between w-full px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-semibold transition shadow-md shadow-red-950/50"
          >
            <span>Launch Investigation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-1">
          <div className="px-3 pb-1 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Investigation Suite
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 shadow-sm"
                    : "text-slate-200 hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-300"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/40 font-mono">
                    {item.badge}
                  </span>
                )}
                {item.alertCount && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-800/40 font-mono font-bold">
                    {item.alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Analyst Profile & Operational Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400">
            SA
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-200 truncate">Special Agent A. Roy</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">Financial Cybercrime Unit</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
};
