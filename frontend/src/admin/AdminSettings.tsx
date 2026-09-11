import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  Settings,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  RefreshCw,
  UserCheck,
  Bell,
  ToggleLeft,
  ToggleRight,
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

// Fallback defaults if backend endpoint isn't wired yet
const DEFAULT_SETTINGS = {
  auto_assign_clinician: false,
  default_clinician_uid: "",
  notification_thresholds: {
    twin_score_critical: 30,
    twin_score_warning: 50,
    hrv_drop_pct: 20,
  },
  ocr_auto_confirm: false,
};

type SettingsData = typeof DEFAULT_SETTINGS;

function Toggle({
  value,
  onChange,
  label,
  sub,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub && <div className="text-xs text-white/40 mt-0.5">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
          value
            ? "bg-teal-600/20 border-teal-600/40 text-teal-300"
            : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
        }`}
      >
        {value ? (
          <ToggleRight className="w-4 h-4" />
        ) : (
          <ToggleLeft className="w-4 h-4" />
        )}
        {value ? "On" : "Off"}
      </button>
    </div>
  );
}

function NumberInput({
  label,
  sub,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub && <div className="text-xs text-white/40 mt-0.5">{sub}</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-right outline-none focus:border-teal-500 transition-colors"
        />
        {unit && <span className="text-xs text-white/40">{unit}</span>}
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const { idToken } = useAuth();
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  const { data, isLoading, refetch } = useQuery<SettingsData>({
    queryKey: ["admin-settings"],
    queryFn: () =>
      apiFetch("/api/admin/settings", idToken).catch(() => DEFAULT_SETTINGS),
    enabled: !!idToken,
    staleTime: 60_000,
  });

  const [local, setLocal] = useState<SettingsData | null>(null);
  const settings: SettingsData = local ?? data ?? DEFAULT_SETTINGS;

  const merge = (patch: Partial<SettingsData>) =>
    setLocal((prev) => ({ ...(prev ?? data ?? DEFAULT_SETTINGS), ...patch }));

  const mergeThreshold = (patch: Partial<SettingsData["notification_thresholds"]>) =>
    setLocal((prev) => {
      const base = prev ?? data ?? DEFAULT_SETTINGS;
      return {
        ...base,
        notification_thresholds: { ...base.notification_thresholds, ...patch },
      };
    });

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/admin/settings", idToken, {
        method: "POST",
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      setSaveSuccess("Settings saved successfully.");
      setSaveError("");
      setLocal(null);
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setTimeout(() => setSaveSuccess(""), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.message || "Failed to save settings.");
      setSaveSuccess("");
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-slate-700/40 border border-slate-600/40 flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Admin Settings
            </h1>
          </div>
          <p className="text-sm text-white/40">
            Superadmin only · Platform-level configuration
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Reload
        </button>
      </div>

      {/* Feedback */}
      {saveSuccess && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {saveError}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 text-white/40 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading settings…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Clinician Assignment */}
          <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-bold">Clinician Assignment</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              <Toggle
                value={settings.auto_assign_clinician}
                onChange={(v) => merge({ auto_assign_clinician: v })}
                label="Auto-assign default clinician"
                sub="New users are automatically assigned to the default clinician below"
              />
              <div className="py-3">
                <label className="text-sm font-semibold text-white block mb-2">
                  Default Clinician UID
                </label>
                <p className="text-xs text-white/40 mb-2">
                  Firebase UID of the clinician new users are assigned to when
                  auto-assignment is on.
                </p>
                <input
                  type="text"
                  value={settings.default_clinician_uid}
                  onChange={(e) =>
                    merge({ default_clinician_uid: e.target.value })
                  }
                  placeholder="Firebase UID"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-colors placeholder:text-white/30 font-mono"
                />
              </div>
            </div>
          </section>

          {/* Notification Thresholds */}
          <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Notification Thresholds</h2>
            </div>
            <p className="text-sm text-white/40 mb-4">
              These thresholds control when automated clinical alerts fire for
              clinicians.
            </p>
            <div className="divide-y divide-white/[0.06]">
              <NumberInput
                label="Twin Score — Critical alert"
                sub="Alert fires when Twin Score drops below this value"
                value={settings.notification_thresholds.twin_score_critical}
                onChange={(v) =>
                  mergeThreshold({ twin_score_critical: v })
                }
                min={0}
                max={100}
              />
              <NumberInput
                label="Twin Score — Warning alert"
                sub="Alert fires when Twin Score drops below this value"
                value={settings.notification_thresholds.twin_score_warning}
                onChange={(v) =>
                  mergeThreshold({ twin_score_warning: v })
                }
                min={0}
                max={100}
              />
              <NumberInput
                label="HRV Drop Threshold"
                sub="Alert fires when HRV drops by this % from 7-day baseline"
                value={settings.notification_thresholds.hrv_drop_pct}
                onChange={(v) => mergeThreshold({ hrv_drop_pct: v })}
                min={0}
                max={100}
                unit="%"
              />
            </div>
          </section>

          {/* OCR */}
          <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold">OCR & Report Processing</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              <Toggle
                value={settings.ocr_auto_confirm}
                onChange={(v) => merge({ ocr_auto_confirm: v })}
                label="Auto-confirm OCR extractions"
                sub="Extracted lab values are automatically confirmed without clinician review"
              />
            </div>
          </section>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || local === null}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold py-2.5 px-8 rounded-xl transition-colors cursor-pointer"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
