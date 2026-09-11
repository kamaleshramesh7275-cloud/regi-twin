import { useState, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { ClientDetailContext } from "./ClientDetailContext";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Clock,
  ChevronRight,
  Filter,
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

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    confirmed: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    pending: "text-amber-400 bg-amber-500/15 border-amber-500/30",
    flagged: "text-red-400 bg-red-500/15 border-red-500/30",
    processing: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
        cfg[status] ?? "text-white/40 bg-white/5 border-white/10"
      } capitalize`}
    >
      {status}
    </span>
  );
}

export default function AdminClinicReports() {
  const { idToken } = useAuth();
  const { openClient } = useContext(ClientDetailContext);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch cross-client reports — clinician endpoint returns reports for all
  // assigned clients; superadmin sees platform-wide
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-clinic-reports", statusFilter, page],
    queryFn: () =>
      apiFetch(
        `/api/clinician/reports?status=${statusFilter}&page=${page}&page_size=${pageSize}`,
        idToken
      ),
    enabled: !!idToken,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const reports: any[] = data?.reports ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusOptions = ["all", "pending", "confirmed", "flagged", "processing"];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-700/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Clinic Report Oversight
            </h1>
          </div>
          <p className="text-sm text-white/40">
            Cross-client view of uploaded and flagged clinic reports
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-white/30" />
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all capitalize cursor-pointer ${
              statusFilter === s
                ? "bg-teal-600/20 border-teal-600/40 text-teal-300"
                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white hover:border-white/20"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center gap-3 text-white/40 py-16 justify-center">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading reports…
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400 opacity-60" />
          <p className="text-red-400 text-sm">{(error as Error).message}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <FileText className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold mb-2 text-white/40">
            No reports found
          </h3>
          <p className="text-sm">
            {statusFilter !== "all"
              ? `No reports with status "${statusFilter}".`
              : "No clinic reports have been uploaded yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-white/[0.06] text-xs font-bold text-white/30 uppercase tracking-widest">
              <div>Report</div>
              <div>Client</div>
              <div>Status</div>
              <div>Uploaded</div>
              <div />
            </div>

            {reports.map((r: any) => (
              <div
                key={r.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-teal-950/10 transition-colors items-center"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white text-sm truncate">
                    {r.lab_name || r.filename || "Unnamed Report"}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {r.report_date
                      ? new Date(r.report_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Date unknown"}
                    {r.total_metrics != null &&
                      ` · ${r.total_metrics} metrics`}
                  </div>
                </div>

                <div className="min-w-0">
                  {r.user_id ? (
                    <button
                      onClick={() => openClient(r.user_id)}
                      className="text-sm text-teal-400 hover:text-teal-300 transition-colors truncate block text-left"
                    >
                      {r.user_email?.split("@")[0] || r.user_id.slice(0, 10) + "…"}
                    </button>
                  ) : (
                    <span className="text-sm text-white/30">—</span>
                  )}
                  {r.user_email && (
                    <div className="text-xs text-white/30 truncate">
                      {r.user_email}
                    </div>
                  )}
                </div>

                <div>
                  <StatusBadge status={r.status ?? "pending"} />
                </div>

                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {timeAgo(r.created_at)}
                </div>

                <div>
                  {r.status === "flagged" ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : r.status === "confirmed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">
                Page {page} of {totalPages} · {total} reports
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
