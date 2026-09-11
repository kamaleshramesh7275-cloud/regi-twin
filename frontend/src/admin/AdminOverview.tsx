import React, { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { ClientDetailContext } from "./ClientDetailContext";
import {
  Users,
  Activity,
  FileText,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  UserCheck,
  Zap,
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

// ── Reusable stat card ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "teal",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: "teal" | "amber" | "blue" | "emerald" | "purple";
}) {
  const colors: Record<string, string> = {
    teal: "text-teal-400 bg-teal-950/60 border-teal-800/40",
    amber: "text-amber-400 bg-amber-950/60 border-amber-800/40",
    blue: "text-blue-400 bg-blue-950/60 border-blue-800/40",
    emerald: "text-emerald-400 bg-emerald-950/60 border-emerald-800/40",
    purple: "text-purple-400 bg-purple-950/60 border-purple-800/40",
  };
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-teal-700/30 transition-all">
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${colors[accent]}`}
      >
        {icon}
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-sm font-semibold text-white/60">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

// ── Score pill ─────────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-white/30 text-sm">—</span>;
  const color =
    score >= 75
      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
      : score >= 50
      ? "text-amber-400 bg-amber-500/15 border-amber-500/30"
      : "text-red-400 bg-red-500/15 border-red-500/30";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}
    >
      <Activity className="w-3 h-3" />
      {score}
    </span>
  );
}

// ── Severity badge ─────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, string> = {
    caution: "text-amber-400 bg-amber-500/15 border-amber-500/30",
    info: "text-blue-400 bg-blue-500/15 border-blue-500/30",
    warning: "text-red-400 bg-red-500/15 border-red-500/30",
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

// ── Clinician view — assigned client list ──────────────────────────────────────

function ClinicianView() {
  const { idToken } = useAuth();
  const { openClient } = useContext(ClientDetailContext);
  const [page, setPage] = React.useState(1);
  const pageSize = 25;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["clinician-clients", page],
    queryFn: () =>
      apiFetch(
        `/api/clinician/clients?page=${page}&page_size=${pageSize}`,
        idToken
      ),
    enabled: !!idToken,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const clients: any[] = data?.clients ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-700/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              My Assigned Clients
            </h1>
          </div>
          <p className="text-sm text-white/40">
            {total} client{total !== 1 ? "s" : ""} assigned · Click a row for
            full detail
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-white/40 py-16 justify-center">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading clients…
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400 opacity-60" />
          <p className="text-red-400 text-sm">{(error as Error).message}</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Users className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold mb-2 text-white/40">
            No clients assigned
          </h3>
          <p className="text-sm">
            Ask your superadmin to assign clients to your account.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_auto] gap-4 px-6 py-3 border-b border-white/[0.06] text-xs font-bold text-white/30 uppercase tracking-widest">
              <div>Client</div>
              <div>Twin Score</div>
              <div>Latest Alert</div>
              <div>Last Active</div>
              <div />
            </div>

            {clients.map((client) => (
              <button
                key={client.user_id}
                id={`client-row-${client.user_id}`}
                onClick={() => openClient(client.user_id)}
                className="grid grid-cols-[2fr_1fr_1.5fr_1fr_auto] gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-teal-950/20 transition-colors text-left w-full items-center group"
              >
                <div>
                  <div className="font-semibold text-white truncate">
                    {client.email?.split("@")[0] || "Unknown"}
                  </div>
                  <div className="text-xs text-white/40 truncate">
                    {client.email}
                  </div>
                  {client.mode && (
                    <div className="text-xs text-white/30 mt-0.5">
                      {client.mode}
                    </div>
                  )}
                </div>

                <div>
                  <ScorePill score={client.twin_score} />
                </div>

                <div>
                  {client.latest_alert ? (
                    <div className="flex items-center gap-1.5">
                      <SeverityBadge severity={client.latest_alert.severity} />
                      <span className="text-xs text-white/50 truncate">
                        {client.latest_alert.title}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs">No alerts</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-white/40 text-sm">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {timeAgo(client.last_active)}
                </div>

                <div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">
                Page {page} of {totalPages} · {total} clients
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-bold border border-white/10 rounded-xl disabled:opacity-30 hover:border-teal-700/50 transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-bold border border-white/10 rounded-xl disabled:opacity-30 hover:border-teal-700/50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Superadmin view — platform aggregates ──────────────────────────────────────

function SuperadminView() {
  const { idToken } = useAuth();

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/api/admin/stats", idToken),
    refetchInterval: 30_000,
    enabled: !!idToken,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch("/api/admin/users", idToken),
    refetchInterval: 60_000,
    enabled: !!idToken,
  });

  const roleBreakdown = stats
    ? { ...stats.role_breakdown_firebase, ...stats.role_breakdown_local }
    : {};

  const recentUsers = (users as any[]).slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-700/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Platform Overview
            </h1>
          </div>
          <p className="text-sm text-white/40">
            Live platform metrics · Auto-refreshes every 30 seconds
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex items-center gap-3 text-white/40 py-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading stats…
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Users"
            value={
              stats?.total_firebase_users ?? stats?.total_backend_users ?? "—"
            }
            sub="Firebase Auth"
            accent="blue"
          />
          <StatCard
            icon={<UserCheck className="w-5 h-5" />}
            label="Clinicians"
            value={roleBreakdown.clinician ?? 0}
            accent="teal"
          />
          <StatCard
            icon={<Shield className="w-5 h-5" />}
            label="Superadmins"
            value={roleBreakdown.superadmin ?? 0}
            accent="amber"
          />
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Reports"
            value={stats?.clinic_reports?.total ?? "—"}
            sub={`${stats?.clinic_reports?.confirmed ?? 0} confirmed`}
            accent="emerald"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Workouts"
            value={stats?.total_workouts ?? "—"}
            accent="purple"
          />
        </div>
      )}

      {/* Recent signups */}
      {recentUsers.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
            Recent Users (latest 5)
          </h2>
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
            {recentUsers.map((u: any, i: number) => (
              <div
                key={u.uid}
                className={`flex items-center gap-4 px-5 py-3 ${
                  i < recentUsers.length - 1
                    ? "border-b border-white/[0.04]"
                    : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-teal-900/50 border border-teal-700/30 flex items-center justify-center text-xs font-bold text-teal-300 shrink-0">
                  {u.display_name?.[0] ?? u.email?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {u.display_name || u.email?.split("@")[0] || "—"}
                  </div>
                  <div className="text-xs text-white/30 truncate">
                    {u.email}
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    u.role === "superadmin"
                      ? "text-amber-300 bg-amber-500/15 border-amber-500/30"
                      : u.role === "clinician"
                      ? "text-teal-300 bg-teal-500/15 border-teal-500/30"
                      : "text-white/50 bg-white/5 border-white/10"
                  } capitalize`}
                >
                  {u.role ?? "client"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function AdminOverview() {
  const { role } = useAuth();
  return role === "superadmin" ? <SuperadminView /> : <ClinicianView />;
}
