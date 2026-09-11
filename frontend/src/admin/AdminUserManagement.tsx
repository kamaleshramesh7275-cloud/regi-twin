import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  UserCog,
  Users,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Link as LinkIcon,
  UserCheck,
  RefreshCw,
} from "lucide-react";

const API_BASE = "";

async function apiFetch(
  url: string,
  token: string | null,
  options: RequestInit = {}
) {
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body && typeof options.body === "string"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── Role badge ─────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { bg: string; text: string }> = {
    superadmin: {
      bg: "bg-amber-500/20 border-amber-500/40",
      text: "text-amber-300",
    },
    clinician: {
      bg: "bg-teal-500/20 border-teal-500/40",
      text: "text-teal-300",
    },
    client: {
      bg: "bg-white/10 border-white/20",
      text: "text-white/60",
    },
  };
  const c = cfg[role] ?? cfg.client;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.bg} ${c.text} capitalize`}
    >
      {role}
    </span>
  );
}

// ── Set Role Form ──────────────────────────────────────────────────────────────

function SetRoleForm({
  token,
  onSuccess,
}: {
  token: string | null;
  onSuccess: () => void;
}) {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"client" | "clinician" | "superadmin">(
    "client"
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim()) {
      setError("Firebase UID is required.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await apiFetch("/api/admin/set-role", token, {
        method: "POST",
        body: JSON.stringify({
          target_uid: uid.trim(),
          target_email: email.trim() || undefined,
          role,
        }),
      });
      setSuccess(result.message || `Role '${role}' set.`);
      setUid("");
      setEmail("");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to set role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Firebase UID (required)"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-colors placeholder:text-white/30"
          required
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-colors placeholder:text-white/30"
        />
        <div className="relative">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="client">client</option>
            <option value="clinician">clinician</option>
            <option value="superadmin">superadmin</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 text-sm cursor-pointer"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Set Role
      </button>
    </form>
  );
}

// ── Assign Clients Form ────────────────────────────────────────────────────────

function AssignClientsForm({
  token,
  onSuccess,
}: {
  token: string | null;
  onSuccess: () => void;
}) {
  const [clinicianUid, setClinicianUid] = useState("");
  const [clinicianEmail, setClinicianEmail] = useState("");
  const [clientUidsText, setClientUidsText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicianUid.trim()) {
      setError("Clinician UID is required.");
      return;
    }
    const client_uids = clientUidsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await apiFetch("/api/admin/assign-clients", token, {
        method: "POST",
        body: JSON.stringify({
          clinician_uid: clinicianUid.trim(),
          clinician_email: clinicianEmail.trim() || undefined,
          client_uids,
        }),
      });
      setSuccess(
        `Assigned ${result.assigned_client_count} client(s) to clinician.`
      );
      setClinicianUid("");
      setClinicianEmail("");
      setClientUidsText("");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to assign clients.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Clinician Firebase UID (required)"
          value={clinicianUid}
          onChange={(e) => setClinicianUid(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-colors placeholder:text-white/30"
          required
        />
        <input
          type="email"
          placeholder="Clinician email (optional)"
          value={clinicianEmail}
          onChange={(e) => setClinicianEmail(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-colors placeholder:text-white/30"
        />
      </div>
      <textarea
        placeholder={
          "Client UIDs (one per line or comma-separated)\nThis REPLACES the existing assignment list."
        }
        value={clientUidsText}
        onChange={(e) => setClientUidsText(e.target.value)}
        rows={4}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-colors placeholder:text-white/30 resize-none font-mono"
      />
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 text-sm cursor-pointer"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <LinkIcon className="w-4 h-4" />
        Save Assignment
      </button>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminUserManagement() {
  const { idToken } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch("/api/admin/users", idToken),
    refetchInterval: 60_000,
    enabled: !!idToken,
  });

  const {
    data: assignments = [],
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["admin-assignments"],
    queryFn: () =>
      apiFetch("/api/admin/clinician-assignments", idToken),
    refetchInterval: 60_000,
    enabled: !!idToken,
  });

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-assignments"] });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-700/40 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              User & Role Management
            </h1>
          </div>
          <p className="text-sm text-white/40">
            Superadmin only · Roles take effect on next token refresh
          </p>
        </div>
        <button
          onClick={() => {
            refetchUsers();
            refetchAssignments();
          }}
          className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Set Role */}
      <section className="mb-8">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserCog className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Assign / Change Role</h2>
          </div>
          <p className="text-sm text-white/40 mb-5">
            Roles are set as Firebase custom claims and mirrored locally for
            audit. The user must refresh their token (or re-login) to see the
            change.
          </p>
          <SetRoleForm token={idToken} onSuccess={handleMutationSuccess} />
        </div>
      </section>

      {/* Clinician Assignments */}
      <section className="mb-8">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold">
              Clinician → Client Assignments
            </h2>
          </div>
          <p className="text-sm text-white/40 mb-5">
            Assigns which clients a clinician can view. The submitted list{" "}
            <strong>replaces</strong> the existing assignment.
          </p>
          <AssignClientsForm
            token={idToken}
            onSuccess={handleMutationSuccess}
          />

          {assignments.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest">
                Current Assignments
              </h3>
              {(assignments as any[]).map((a) => (
                <div
                  key={a.clinician_uid}
                  className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl"
                >
                  <UserCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {a.clinician_email || a.clinician_uid}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {a.client_uids.length} client(s) assigned
                      {a.updated_at
                        ? ` · updated ${new Date(
                            a.updated_at
                          ).toLocaleDateString()}`
                        : ""}
                    </div>
                    {a.client_uids.length > 0 && (
                      <div className="text-xs text-white/30 mt-1 font-mono truncate">
                        {a.client_uids.slice(0, 3).join(", ")}
                        {a.client_uids.length > 3
                          ? ` + ${a.client_uids.length - 3} more`
                          : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* User List */}
      <section>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-white/50" />
            <h2 className="text-lg font-bold">All Users</h2>
            {!usersLoading && (
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                {(users as any[]).length}
              </span>
            )}
          </div>

          {usersLoading ? (
            <div className="flex items-center gap-3 text-white/40 py-4">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading users…
            </div>
          ) : (users as any[]).length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No users found. Firebase service account may not be configured.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/30 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-3 font-semibold">User</th>
                    <th className="text-left py-3 px-3 font-semibold">UID</th>
                    <th className="text-left py-3 px-3 font-semibold">Role</th>
                    <th className="text-left py-3 px-3 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(users as any[]).map((u) => (
                    <tr
                      key={u.uid}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white truncate max-w-[200px]">
                          {u.display_name || u.email?.split("@")[0] || "—"}
                        </div>
                        <div className="text-xs text-white/40 truncate max-w-[200px]">
                          {u.email}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <code className="text-xs text-white/30 font-mono">
                          {u.uid.slice(0, 12)}…
                        </code>
                      </td>
                      <td className="py-3 px-3">
                        <RoleBadge role={u.role ?? "client"} />
                      </td>
                      <td className="py-3 px-3">
                        {u.disabled ? (
                          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                            Disabled
                          </span>
                        ) : u.email_verified ? (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            Unverified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
