import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  X,
  AlertTriangle,
  Loader2,
  Heart,
  TrendingUp,
  FileText,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const API_BASE = "";

async function apiFetch(url: string, token: string | null) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

function timeAgo(iso: string | null | undefined) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (d > 1) return `${d}d ago`;
  if (d === 1) return "Yesterday";
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

// ── Metric status styling ──────────────────────────────────────────────────────

function metricStatusStyle(status: string) {
  if (status === "high") return "text-red-400 bg-red-500/10 border-red-500/20";
  if (status === "low")
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
}

function MetricStatusIcon({ status }: { status: string }) {
  if (status === "high") return <ArrowUpRight className="w-3 h-3" />;
  if (status === "low") return <ArrowDownRight className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

// ── Expandable report row (read-only) ─────────────────────────────────────────

function ReadOnlyReportRow({
  report,
  token,
}: {
  report: any;
  token: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["admin-report-metrics", report.id],
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
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-3 flex items-center gap-2 hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {report.lab_name || report.filename}
          </div>
          <div className="text-xs text-white/40 mt-0.5">
            {report.report_date
              ? new Date(report.report_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Date unknown"}
            {" · "}
            {report.total_metrics} metrics
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
        <div className="border-t border-white/[0.06] px-3 py-2 bg-black/20">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-white/40">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading
              metrics…
            </div>
          ) : detail?.metrics?.length > 0 ? (
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3" /> Confirmed Lab Values
              </div>
              {detail.metrics.map((m: any, i: number) => (
                <div
                  key={m.metric_key || i}
                  className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0"
                >
                  <span className="text-xs text-white/70 truncate max-w-[55%]">
                    {m.canonical_name || m.metric_key}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {m.value != null
                        ? Number(m.value).toFixed(m.value < 10 ? 2 : 1)
                        : "—"}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {m.unit || ""}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${metricStatusStyle(
                        m.status || "normal"
                      )}`}
                    >
                      <MetricStatusIcon status={m.status || "normal"} />
                      {(m.status || "normal").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40 py-2">
              No metric data available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Severity badge ─────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, string> = {
    caution: "text-amber-400 bg-amber-500/15 border-amber-500/30",
    info: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
        cfg[severity] ?? cfg.info
      }`}
    >
      {severity}
    </span>
  );
}

// ── Main Drawer ────────────────────────────────────────────────────────────────

export default function AdminClientDetail({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const { idToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-client-detail", clientId],
    queryFn: () => apiFetch(`/api/clinician/client/${clientId}`, idToken),
    enabled: !!clientId,
    staleTime: 30_000,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-[#060e1c] border-l border-teal-900/40 h-full overflow-y-auto flex flex-col shadow-2xl z-10">
        {/* Header */}
        <div className="sticky top-0 bg-[#060e1c]/95 backdrop-blur-sm border-b border-teal-900/30 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-teal-400 uppercase tracking-[0.15em] font-bold mb-1">
              Client Detail · Read-only
            </div>
            <div className="font-bold text-white">
              {data?.user?.email || clientId}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-white/40">
            <Loader2 className="w-6 h-6 animate-spin" /> Loading client data…
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center text-red-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-60" />
              <p className="text-sm">{(error as Error).message}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile */}
            <section>
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                Profile
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Mode", value: data?.user?.mode },
                  { label: "Age", value: data?.user?.age },
                  { label: "Sex", value: data?.user?.sex },
                  {
                    label: "Weight",
                    value: data?.user?.weight
                      ? `${data.user.weight} kg`
                      : "—",
                  },
                  {
                    label: "Height",
                    value: data?.user?.height
                      ? `${data.user.height} cm`
                      : "—",
                  },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3"
                  >
                    <div className="text-xs text-white/40 mb-1">{f.label}</div>
                    <div className="text-sm font-semibold">{f.value ?? "—"}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Latest Vitals */}
            {data?.last_wearable && (
              <section>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5" /> Latest Vitals
                  <span className="text-white/20 font-normal">
                    {timeAgo(data.last_wearable.timestamp)}
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Heart Rate",
                      value: data.last_wearable.heart_rate
                        ? `${data.last_wearable.heart_rate} bpm`
                        : "—",
                    },
                    {
                      label: "HRV",
                      value: data.last_wearable.hrv
                        ? `${data.last_wearable.hrv} ms`
                        : "—",
                    },
                    {
                      label: "SpO2",
                      value: data.last_wearable.spo2
                        ? `${data.last_wearable.spo2}%`
                        : "—",
                    },
                    {
                      label: "Sleep",
                      value: data.last_wearable.sleep_hours
                        ? `${data.last_wearable.sleep_hours}h`
                        : "—",
                    },
                    {
                      label: "Readiness",
                      value: data.last_wearable.readiness_score ?? "—",
                    },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3"
                    >
                      <div className="text-xs text-white/40 mb-1">
                        {f.label}
                      </div>
                      <div className="text-sm font-semibold">{f.value}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Clinical Alerts */}
            {data?.clinical_alerts?.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />{" "}
                  Active Alerts
                </h3>
                <div className="space-y-2">
                  {data.clinical_alerts.map((a: any) => (
                    <div
                      key={a.id}
                      className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold">{a.title}</span>
                        <SeverityBadge severity={a.severity} />
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">
                        {a.message}
                      </p>
                      <div className="text-xs text-white/30 mt-1">
                        {timeAgo(a.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Clinical Reports (read-only, expandable) */}
            {data?.clinical_reports?.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Report History
                  <span className="text-white/20 font-normal ml-1">
                    (read-only)
                  </span>
                </h3>
                <div className="space-y-2">
                  {data.clinical_reports.map((r: any) => (
                    <ReadOnlyReportRow
                      key={r.id}
                      report={r}
                      token={idToken}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Capability History */}
            {data?.capability_history?.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Capability Trend
                  (latest)
                </h3>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  {(() => {
                    const c = data.capability_history[0];
                    const fields = [
                      { label: "Mobility", val: c.mobility },
                      { label: "Stability", val: c.stability },
                      { label: "Quality", val: c.movement_quality },
                      { label: "Cardio", val: c.cardiovascular_efficiency },
                      { label: "Recovery", val: c.recovery },
                    ];
                    return (
                      <div className="space-y-2">
                        {fields.map((f) => (
                          <div
                            key={f.label}
                            className="flex items-center gap-3"
                          >
                            <span className="text-xs text-white/40 w-16">
                              {f.label}
                            </span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(
                                    (f.val ?? 0) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-white/60 w-10 text-right">
                              {f.val != null
                                ? Math.round(f.val * 100)
                                : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
