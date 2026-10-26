import React from "react";

interface RiskBadgeProps {
  score?: number;
  level?: string;
  size?: "sm" | "md" | "lg";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, level, size = "md" }) => {
  const normLevel = level ? level.toUpperCase() : score !== undefined ? (score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW") : "LOW";

  const colorStyles: Record<string, string> = {
    CRITICAL: "bg-red-950/80 text-red-300 border-red-500/50 shadow-red-900/30",
    HIGH: "bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-900/30",
    MEDIUM: "bg-yellow-950/60 text-yellow-300 border-yellow-500/40",
    LOW: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
  };

  const dotColors: Record<string, string> = {
    CRITICAL: "bg-red-500 animate-pulse",
    HIGH: "bg-amber-500",
    MEDIUM: "bg-yellow-400",
    LOW: "bg-emerald-400"
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-bold"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm tracking-wide uppercase font-mono ${colorStyles[normLevel] || colorStyles.LOW} ${sizeStyles[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[normLevel] || dotColors.LOW}`} />
      {score !== undefined && <span className="font-bold">{Math.round(score)}</span>}
      <span>{normLevel}</span>
    </span>
  );
};
