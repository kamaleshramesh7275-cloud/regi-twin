import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  Clock,
  Cpu,
  Bell,
  Database,
} from "lucide-react";

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
  if (!iso) return "—";
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

function HealthCard({
  icon,
  label,
  value,
  sub,
  status = "ok",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  status?: "ok" | "warn" | "error" | "unknown";
}) {
  const statusStyles = {
    ok: "border-emerald-700/30 bg-emerald-950/20",
    warn: "border-amber-700/30 bg-amber-950/20",
    error: "border-red-700/30 bg-red-950/20",
    unknown: "border-white/[0.07] bg-white/[0.02]",
  };
  const dotStyles = {
    ok: "bg-emerald-400",
    warn: "bg-amber-400",
    error: "bg-red-400",
    unknown: "bg-white/30",
  };
  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${statusStyles[status]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-teal-400">
          {icon}
        </div>
        <span
          className={`w-2.5 h-2.5 rounded-full ${dotStyles[status]} ${
            status === "error" ? "animate-pulse" : ""
          }`}
        />
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-sm font-semibold text-white/60">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminSystemHealth() {
  const { idToken } = useAuth();

  const {
    data: stats,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/api/admin/stats", idToken),
    refetchInterval: 30_000,
    enabled: !!idToken,
  });

  const {
    data: healthData,
    isLoading: healthLoading,
  } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: () =>
      apiFetch("/api/admin/system-health", idToken).catch(() => null),
    refetchInterval: 30_000,
    enabled: !!idToken,
  });

  const ocrTotal = stats?.clinic_reports?.total ?? 0;
  const ocrConfirmed = stats?.clinic_reports?.confirmed ?? 0;
  const ocrFailed = healthData?.ocr_failures ?? 0;
  const notifFailed = healthData?.notification_failures ?? 0;
  const errorRate = healthData?.error_rate_pct ?? null;
  const recentErrors: any[] = healthData?.recent_errors ?? [];

  const ocrStatus =
    ocrFailed > 10 ? "error" : ocrFailed > 3 ? "warn" : "ok";
  const notifStatus =
    notifFailed > 10 ? "error" : notifFailed > 2 ? "warn" : "ok";
  const errorStatus =
    errorRate === null
      ? "unknown"
      : errorRate > 5
      ? "error"
      : errorRate > 1
      ? "warn"
      : "ok";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-700/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              System Health
            </h1>
          </div>
          <p className="text-sm text-white/40">
            Superadmin only · Refreshes every 30s
            {dataUpdatedAt > 0 && (
              <span className="ml-2">
                · Last updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isLoading || healthLoading ? (
        <div className="flex items-center gap-3 text-white/40 py-12 justify-center">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading health data…
        </div>
      ) : (
        <>
          {/* Health cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <HealthCard
              icon={<Cpu className="w-5 h-5" />}
              label="OCR Job Failures"
              value={ocrFailed}
              sub={`${ocrTotal} total reports, ${ocrConfirmed} confirmed`}
              status={ocrStatus}
            />
            <HealthCard
              icon={<Bell className="w-5 h-5" />}
              label="Notification Failures"
              value={notifFailed}
              sub="Last 24 hours"
              status={notifStatus}
            />
            <HealthCard
              icon={<XCircle className="w-5 h-5" />}
              label="Error Rate"
              value={
                errorRate !== null ? `${errorRate.toFixed(1)}%` : "—"
              }
              sub="5xx responses"
              status={errorStatus}
            />
            <HealthCard
              icon={<Database className="w-5 h-5" />}
              label="DB Records"
              value={stats?.total_backend_users ?? "—"}
              sub="Users in local DB"
              status="ok"
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-6 text-xs text-white/30">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> OK
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Warning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />{" "}
              Error
            </span>
          </div>

          {/* Recent errors table */}
          <section>
            <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
              Recent Error Log
            </h2>
            {recentErrors.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
                <p className="text-sm text-white/40">
                  {healthData
                    ? "No recent errors — system is healthy."
                    : "System health endpoint not available. Errors will appear here when the /api/admin/system-health endpoint is implemented."}
                </p>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-bold text-white/30 uppercase tracking-widest">
                  <div>Level</div>
                  <div>Message</div>
                  <div>Time</div>
                </div>
                {recentErrors.map((e: any, i: number) => (
                  <div
                    key={i}
                    className="grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-3 border-b border-white/[0.04] last:border-0 items-start"
                  >
                    <div>
                      {e.level === "error" ? (
                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-bold">
                          ERROR
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                          WARN
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white/70 font-mono text-xs leading-relaxed">
                      {e.message}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/30 text-xs whitespace-nowrap">
                      <Clock className="w-3 h-3 shrink-0" />
                      {timeAgo(e.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Stats breakdown */}
          <section className="mt-8">
            <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
              Platform Stats Snapshot
            </h2>
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  {
                    label: "Firebase Users",
                    value: stats?.total_firebase_users ?? "—",
                  },
                  {
                    label: "Backend Users",
                    value: stats?.total_backend_users ?? "—",
                  },
                  {
                    label: "Total Workouts",
                    value: stats?.total_workouts ?? "—",
                  },
                  {
                    label: "Reports (Total)",
                    value: stats?.clinic_reports?.total ?? "—",
                  },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-xs text-white/30 mb-1">{s.label}</div>
                    <div className="text-lg font-black text-white">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
