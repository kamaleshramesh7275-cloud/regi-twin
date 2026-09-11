import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Loader2,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

const API_BASE = typeof window !== "undefined" ? "" : "http://localhost:8000";

export function metricStatusStyle(status: string) {
  if (status === "high") return "text-red-400 bg-red-500/10 border-red-500/20";
  if (status === "low") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
}

export function MetricStatusIcon({ status }: { status: string }) {
  if (status === "high") return <ArrowUpRight className="w-3 h-3" />;
  if (status === "low") return <ArrowDownRight className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

export function ClinicianReportRow({
  report,
  token,
}: {
  report: any;
  token: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["clinician-report-metrics", report.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/clinic/report/${report.id}/metrics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    enabled: expanded,
    staleTime: 60_000,
  });

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-3 flex items-center gap-2 hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{report.lab_name || report.filename}</div>
          <div className="text-xs text-white/40 mt-0.5">
            {report.report_date
              ? new Date(report.report_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Date unknown"}
            {" · "}{report.total_metrics || 0} metrics
          </div>
        </div>
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-3 py-2 bg-black/20">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-white/40">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading metrics…
            </div>
          ) : detail?.metrics?.length > 0 ? (
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3" /> Confirmed Lab Values
              </div>
              {detail.metrics.map((m: any, i: number) => (
                <div
                  key={m.metric_key || i}
                  className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
                >
                  <span className="text-xs text-white/70 truncate max-w-[55%]">
                    {m.canonical_name || m.metric_key}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {m.value != null ? Number(m.value).toFixed(m.value < 10 ? 2 : 1) : "—"}
                    </span>
                    <span className="text-[10px] text-white/30">{m.unit || ""}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${metricStatusStyle(m.status || "normal")}`}
                    >
                      <MetricStatusIcon status={m.status || "normal"} />
                      {(m.status || "normal").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40 py-2">No metric data available.</p>
          )}
        </div>
      )}
    </div>
  );
}
