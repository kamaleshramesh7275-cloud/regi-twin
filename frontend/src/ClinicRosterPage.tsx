import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import {
  Users, ChevronDown, ChevronUp, Activity, AlertTriangle,
  CheckCircle2, Clock, FileText, RefreshCcw, TrendingUp
} from "lucide-react";
import { api } from "./api";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

const RISK_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Low:      { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: <CheckCircle2 className="w-4 h-4" /> },
  Moderate: { color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30",   icon: <AlertTriangle className="w-4 h-4" /> },
  High:     { color: "text-red-400",     bg: "bg-red-500/15 border-red-500/30",     icon: <Activity className="w-4 h-4" /> },
  Unknown:  { color: "text-slate-400",   bg: "bg-slate-500/15 border-slate-500/30",   icon: <Clock className="w-4 h-4" /> },
};

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

interface PatientDetail {
  user: any;
  capability_history: any[];
  pain_logs: any[];
  case_notes: any[];
  injury_risk: any;
}

export default function ClinicRosterPage() {
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [patientDetail, setPatientDetail] = useState<Record<string, PatientDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await api.getClinicRoster();
      setRoster(data);
    } catch {
      setError("Failed to load patient roster. Check admin key.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  const toggleExpand = async (userId: string) => {
    if (expandedId === userId) { setExpandedId(null); return; }
    setExpandedId(userId);
    if (patientDetail[userId]) return;
    setLoadingDetail(userId);
    try {
      const detail = await api.getPatientSummary(userId);
      setPatientDetail(prev => ({ ...prev, [userId]: detail }));
    } catch { /* use cached */ }
    finally { setLoadingDetail(null); }
  };

  const riskCfg = (level: string) => RISK_CONFIG[level] || RISK_CONFIG.Unknown;

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Clinic Patient Roster
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Therapist view — all patients, risk levels, and live metrics.
            </p>
          </div>
          <button onClick={fetchRoster} className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </header>

        {/* Summary Stat Cards */}
        {!loading && roster.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <div className="text-3xl font-black text-primary">{roster.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Patients</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-black text-red-400">{roster.filter(r => r.risk_level === "High").length}</div>
              <div className="text-xs text-muted-foreground mt-1">High Risk</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-black text-amber-400">{roster.filter(r => r.risk_level === "Moderate").length}</div>
              <div className="text-xs text-muted-foreground mt-1">Moderate Risk</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-black text-emerald-400">{roster.filter(r => r.risk_level === "Low").length}</div>
              <div className="text-xs text-muted-foreground mt-1">Low Risk</div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <RefreshCcw className="w-8 h-8 animate-spin opacity-40" />
              Loading patient roster...
            </div>
          </div>
        ) : roster.length === 0 ? (
          <div className="card text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No patients registered yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roster.map((patient) => {
              const rc = riskCfg(patient.risk_level);
              const isExpanded = expandedId === patient.user_id;
              const detail = patientDetail[patient.user_id];

              return (
                <div key={patient.user_id} className="card overflow-hidden transition-all duration-300">
                  {/* Row */}
                  <button
                    onClick={() => toggleExpand(patient.user_id)}
                    className="w-full text-left grid grid-cols-2 md:grid-cols-6 gap-4 items-center p-1"
                  >
                    {/* Patient */}
                    <div className="col-span-2 md:col-span-2">
                      <div className="font-semibold text-sm truncate">{patient.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{patient.mode}</div>
                    </div>

                    {/* Recovery */}
                    <div className="text-center hidden md:block">
                      <div className="text-lg font-black text-primary">
                        {patient.recovery_score != null ? `${patient.recovery_score}%` : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">Recovery</div>
                    </div>

                    {/* ACWR */}
                    <div className="text-center hidden md:block">
                      <div className={`text-lg font-black ${patient.latest_acwr > 1.5 ? "text-red-400" : patient.latest_acwr > 1.3 ? "text-amber-400" : "text-emerald-400"}`}>
                        {patient.latest_acwr > 0 ? `${patient.latest_acwr}x` : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">ACWR</div>
                    </div>

                    {/* Risk Badge */}
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${rc.bg} ${rc.color}`}>
                        {rc.icon} {patient.risk_level}
                      </span>
                    </div>

                    {/* Last Session + expand */}
                    <div className="flex items-center justify-between md:justify-end gap-3">
                      <div className="text-right hidden md:block">
                        <div className="text-xs text-muted-foreground">{timeAgo(patient.last_session)}</div>
                        <div className="text-[10px] text-muted-foreground">Last session</div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-white/5 mt-3 pt-4 px-1 space-y-4">
                      {loadingDetail === patient.user_id ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                          <RefreshCcw className="w-4 h-4 animate-spin" /> Loading patient details...
                        </div>
                      ) : detail ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Capability Trend Mini Chart */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" /> Capability Trend
                            </h4>
                            {detail.capability_history.length > 0 ? (
                              <ResponsiveContainer width="100%" height={100}>
                                <LineChart data={detail.capability_history} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                                  <XAxis dataKey="date" hide />
                                  <YAxis domain={[0, 100]} hide />
                                  <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "6px", fontSize: "11px" }} />
                                  <Line type="monotone" dataKey="recovery" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Recovery" />
                                  <Line type="monotone" dataKey="mobility" stroke="#2563eb" strokeWidth={2} dot={false} name="Mobility" />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-xs text-muted-foreground">No sessions yet.</p>
                            )}
                          </div>

                          {/* Recent Pain Logs */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" /> Recent Pain Logs
                            </h4>
                            {detail.pain_logs.length > 0 ? (
                              <div className="space-y-1.5">
                                {detail.pain_logs.slice(0, 4).map((p, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground capitalize">{p.zone.replace("_", " ")}</span>
                                    <span className={`font-bold ${p.score >= 7 ? "text-red-400" : p.score >= 4 ? "text-amber-400" : "text-emerald-400"}`}>
                                      {p.score}/10
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No pain logs.</p>
                            )}
                          </div>

                          {/* Case Notes */}
                          <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Clinical Notes
                            </h4>
                            {detail.case_notes.length > 0 ? (
                              <div className="space-y-2">
                                {detail.case_notes.slice(0, 3).map((n, i) => (
                                  <div key={i} className="text-xs border-l-2 border-primary/40 pl-2">
                                    <div className="text-muted-foreground mb-0.5">{new Date(n.date).toLocaleDateString()}</div>
                                    <div className="text-foreground line-clamp-2">{n.note}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No case notes.</p>
                            )}
                          </div>

                          {/* Injury Risk Breakdown */}
                          {detail.injury_risk && (
                            <div className={`md:col-span-3 rounded-xl p-4 border ${riskCfg(detail.injury_risk.risk_level).bg}`}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`text-sm font-bold flex items-center gap-2 ${riskCfg(detail.injury_risk.risk_level).color}`}>
                                  {riskCfg(detail.injury_risk.risk_level).icon}
                                  Injury Risk: {detail.injury_risk.risk_score}% — {detail.injury_risk.risk_level}
                                </h4>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{detail.injury_risk.recommendation}</p>
                              <div className="flex flex-wrap gap-2">
                                {detail.injury_risk.contributing_factors?.map((f: any, i: number) => (
                                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-black/20 text-muted-foreground">
                                    {f.factor}: <strong>{f.value}</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Failed to load patient details.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
