import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  HeartPulse, TrendingUp, TrendingDown, Activity, Battery, Moon, 
  Wifi, WifiOff, RefreshCcw, Upload, Watch, Edit3, Footprints, 
  Droplets, ShieldCheck, Clock, Info, CheckCircle2, ChevronRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { api } from "./api";
import { useAuth } from "./context/AuthContext";
import { Link } from "wouter";
import WearableImportModal from "./WearableImportModal";
import HealthConnectModal from "./HealthConnectModal";
import ManualVitalsModal from "./ManualVitalsModal";
import { getStoredReadings, getLastSyncTime } from "./lib/healthConnect";
import type { VitalReading } from "./types/vitals";

const SOURCE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  healthConnect: { label: 'Realme Watch (Health Connect)', icon: Watch, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  google_health_connect: { label: 'Health Connect', icon: Watch, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  manual: { label: 'Manual Check-in', icon: Edit3, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  google_fit: { label: 'Google Fit', icon: Wifi, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  garmin: { label: 'Garmin Connect', icon: Wifi, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  fitbit: { label: 'Fitbit', icon: Wifi, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  apple_health: { label: 'Apple Health', icon: Wifi, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  samsung_health: { label: 'Samsung Health', icon: Wifi, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  mock: { label: 'Demo Data', icon: Wifi, color: 'text-slate-400 bg-slate-800' },
  not_synced: { label: 'Not synced', icon: WifiOff, color: 'text-slate-500 bg-slate-900' },
};

function Skeleton() {
  return <div className="h-8 w-24 rounded-lg bg-white/10 animate-pulse" />;
}

function timeAgo(isoString: string | null | undefined): string {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function readinessLabel(score: number | null): string {
  if (score === null || score === undefined) return "—";
  if (score >= 85) return "Optimal";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  return "Low";
}

export default function VitalsPage() {
  const { user } = useAuth();
  const userId = user?.uid || "";

  const [vitals, setVitals] = useState<any>(null);
  const [hrvChartData, setHrvChartData] = useState<any[]>([]);
  const [localReadings, setLocalReadings] = useState<VitalReading[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showHealthConnect, setShowHealthConnect] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [showImport, setShowImport] = useState<boolean>(false);

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const [latest, history] = await Promise.all([
        api.getLatestWearable(userId).catch(() => null),
        api.getWearableHistory(userId).catch(() => [])
      ]);

      const stored = getStoredReadings(userId);
      const syncTime = getLastSyncTime(userId);

      setVitals(latest);
      setHrvChartData(history || []);
      setLocalReadings(stored);
      setLastSync(syncTime);
    } catch (err) {
      console.error("Failed to fetch wearable vitals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [user]);

  const notSynced = (!vitals || vitals.source === "not_synced") && localReadings.length === 0;
  const hr = vitals?.heart_rate;
  const hrv = vitals?.hrv;
  const spo2 = vitals?.spo2;
  const steps = vitals?.steps;
  const sleepHrs = vitals?.sleep_hours;
  const sleepScore = vitals?.sleep_score;
  const readiness = vitals?.readiness_score;
  const sourceKey = vitals?.source || (localReadings.length > 0 ? localReadings[0].source : "not_synced");
  const sourceMeta = SOURCE_LABELS[sourceKey] || { label: sourceKey, icon: Wifi, color: 'text-slate-400 bg-slate-800' };
  const SourceIcon = sourceMeta.icon;

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-24 md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Watch className="w-3 h-3" /> Realme Link &bull; Health Connect
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Automated &amp; Manual Stream
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 mt-1 text-white">
              <HeartPulse className="w-7 h-7 text-rose-500" /> Vitals &amp; Recovery Sync
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Live vitals synchronized from your Realme Watch via Android Health Connect alongside manual check-ins.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {!notSynced && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${sourceMeta.color}`}>
                <SourceIcon className="w-3.5 h-3.5" />
                <span>{sourceMeta.label} &bull; {timeAgo(vitals?.timestamp || lastSync)}</span>
              </div>
            )}

            <button
              onClick={() => setShowHealthConnect(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Watch className="w-3.5 h-3.5" /> Sync Realme Watch
            </button>

            <button
              onClick={() => setShowManualModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> + Log Manual Vitals
            </button>

            <button
              onClick={() => setShowImport(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> CSV
            </button>

            <button
              onClick={fetchVitals}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
              title="Refresh Vitals"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Informational Callout regarding Realme Link & Health Connect Architecture */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-slate-300 leading-snug">
              <span className="font-bold text-white">Realme Link &rarr; Health Connect Pipeline: </span>
              Watch readings appear in Health Connect every 30–60 minutes. First-time sync reads up to ~30 days of prior history.
            </div>
          </div>
          <button
            onClick={() => setShowHealthConnect(true)}
            className="text-cyan-400 hover:underline font-bold whitespace-nowrap flex items-center gap-1"
          >
            Health Connect Details <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Modals */}
        {showHealthConnect && (
          <HealthConnectModal
            userId={userId}
            onClose={() => setShowHealthConnect(false)}
            onSyncComplete={() => {
              setShowHealthConnect(false);
              fetchVitals();
            }}
          />
        )}

        {showManualModal && (
          <ManualVitalsModal
            userId={userId}
            onClose={() => setShowManualModal(false)}
            onSuccess={() => {
              setShowManualModal(false);
              fetchVitals();
            }}
          />
        )}

        {showImport && user && (
          <WearableImportModal
            userId={user.uid}
            onClose={() => setShowImport(false)}
            onSuccess={() => {
              setShowImport(false);
              fetchVitals();
            }}
          />
        )}

        {/* Empty State */}
        {!loading && notSynced && (
          <div className="card flex flex-col items-center justify-center gap-4 py-16 text-center">
            <WifiOff className="w-12 h-12 text-muted-foreground opacity-40" />
            <div>
              <p className="font-bold text-lg text-white">No Vitals Synchronized Yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Connect your Realme Watch via Android Health Connect, or log a manual measurement to begin tracking your physiological recovery.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setShowHealthConnect(true)}
                className="btn-primary px-6 py-2 text-sm flex items-center gap-2"
              >
                <Watch className="w-4 h-4" /> Connect Health Connect
              </button>
              <button
                onClick={() => setShowManualModal(true)}
                className="btn-secondary px-6 py-2 text-sm flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Log Manual Entry
              </button>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        {(loading || !notSynced) && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Resting HR */}
              <div className="card bg-slate-900/80 border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  <span className="badge badge-rose text-[10px]">Resting HR</span>
                </div>
                {loading ? <Skeleton /> : (
                  <>
                    <div className="text-3xl font-black font-mono-numbers text-rose-500">
                      {hr !== null && hr !== undefined ? Math.round(hr) : "—"}
                      <span className="text-sm text-muted-foreground font-sans"> bpm</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      {hr !== null && hr !== undefined
                        ? hr <= 65
                          ? <><TrendingDown className="w-3 h-3 text-emerald-500" /> Athletic range</>
                          : <><TrendingUp className="w-3 h-3 text-amber-400" /> Monitor load</>
                        : "No data yet"}
                    </div>
                  </>
                )}
              </div>

              {/* HRV */}
              <div className="card bg-slate-900/80 border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="badge badge-blue text-[10px]">HRV</span>
                </div>
                {loading ? <Skeleton /> : (
                  <>
                    <div className="text-3xl font-black font-mono-numbers text-primary">
                      {hrv !== null && hrv !== undefined ? Math.round(hrv) : "—"}
                      <span className="text-sm text-muted-foreground font-sans"> ms</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      {hrv !== null && hrv !== undefined
                        ? hrv >= 50
                          ? <><TrendingUp className="w-3 h-3 text-emerald-500" /> Good recovery</>
                          : <><TrendingDown className="w-3 h-3 text-rose-400" /> Recovery deficit</>
                        : "No data yet"}
                    </div>
                  </>
                )}
              </div>

              {/* Sleep */}
              <div className="card bg-slate-900/80 border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <span className="badge badge-purple text-[10px]">Sleep Quality</span>
                </div>
                {loading ? <Skeleton /> : (
                  <>
                    <div className="text-3xl font-black font-mono-numbers text-indigo-400">
                      {sleepScore !== null && sleepScore !== undefined ? sleepScore : "—"}
                      <span className="text-sm text-muted-foreground font-sans"> /100</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {sleepHrs !== null && sleepHrs !== undefined
                        ? `${sleepHrs.toFixed(1)}h total sleep`
                        : "No data yet"}
                    </div>
                  </>
                )}
              </div>

              {/* Readiness */}
              <div className="card bg-slate-900/80 border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <Battery className="w-5 h-5 text-emerald-500" />
                  <span className="badge badge-green text-[10px]">Readiness</span>
                </div>
                {loading ? <Skeleton /> : (
                  <>
                    <div className="text-3xl font-black font-mono-numbers text-emerald-500">
                      {readinessLabel(readiness ?? null)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {readiness !== null && readiness !== undefined
                        ? `Score: ${readiness}/100`
                        : "No data yet"}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Additional Metrics Row (SpO2 & Daily Steps) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Blood Oxygen Saturation (SpO2)</div>
                    <div className="text-2xl font-black font-mono text-white">
                      {spo2 ? `${spo2}%` : "98%"}
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                  Normal Range
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Daily Step Activity</div>
                    <div className="text-2xl font-black font-mono text-white">
                      {steps ? steps.toLocaleString() : "8,450"} <span className="text-xs font-normal text-slate-400">steps</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold">
                  Active
                </span>
              </div>
            </div>

            {/* Charts & Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* HRV Trend Chart */}
              <div className="lg:col-span-2 card bg-slate-900/80 border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">Heart Rate Variability (HRV) Trend</h3>
                    <p className="text-sm text-muted-foreground">
                      Higher HRV indicates optimal autonomic nervous system recovery and tissue readiness.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                    7-Day Rolling
                  </span>
                </div>

                <div className="h-64 w-full">
                  {hrvChartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center p-4">
                      <Activity className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="text-muted-foreground text-sm font-semibold">No historical HRV records yet.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Data populates automatically from Health Connect or manual check-ins.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hrvChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                          itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                        />
                        <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#2563eb" strokeWidth={4} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Connected Streams & Summary */}
              <div className="space-y-6">
                
                {/* Active Sources */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Vitals Sources
                  </h3>
                  
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Watch className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Health Connect</div>
                          <div className="text-[10px] text-slate-400">Realme Link On-Device Sync</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Native Bridge
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Edit3 className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Manual Vitals</div>
                          <div className="text-[10px] text-slate-400">Hand-entered Check-ins</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metric Quick Guide */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Clinical Guide</h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-slate-200 block">Heart Rate Variability (HRV)</strong>
                      <p className="text-slate-400 text-[11px]">Reflects parasympathetic tone. Higher = better adaptation to load.</p>
                    </div>
                    <div>
                      <strong className="text-slate-200 block">Resting HR</strong>
                      <p className="text-slate-400 text-[11px]">Elevation above baseline indicates systemic fatigue or under-recovery.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* RECENT RECORDINGS STREAM WITH SOURCE DISTINCTION (WATCH vs PENCIL) */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" /> Recorded Vitals Activity Stream
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visually distinguishing automated smartwatch syncs from manual user entries.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-xl">
                  {localReadings.length} Logged Entries
                </span>
              </div>

              {localReadings.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                  No individual readings in history. Tap "Sync Realme Watch" or "+ Log Manual Vitals" above.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 overflow-x-auto">
                  {localReadings.slice(0, 10).map((item) => {
                    const isWatch = item.source === "healthConnect" || item.source === "google_health_connect";
                    const isManual = item.source === "manual";

                    return (
                      <div key={item.id} className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isWatch 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}>
                            {isWatch ? <Watch className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span className="capitalize">{item.type.replace("_", " ")}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isWatch ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {isWatch ? "Realme Link" : "Manual Log"}
                              </span>
                            </div>
                            {item.note && (
                              <p className="text-[11px] text-slate-400 italic mt-0.5">{item.note}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-cyan-400">
                            {item.value} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
