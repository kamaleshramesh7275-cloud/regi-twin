import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { HeartPulse, TrendingUp, TrendingDown, Activity, Battery, Moon, Wifi, WifiOff, RefreshCcw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { api } from "./api";
import { useAuth } from "./context/AuthContext";
import { Link } from "wouter";

const FALLBACK_HRV = [
  { date: 'Mon', hrv: 45 }, { date: 'Tue', hrv: 42 }, { date: 'Wed', hrv: 55 },
  { date: 'Thu', hrv: 60 }, { date: 'Fri', hrv: 58 }, { date: 'Sat', hrv: 65 }, { date: 'Sun', hrv: 62 },
];

const SOURCE_LABELS: Record<string, string> = {
  google_fit: 'Google Fit', garmin: 'Garmin Connect', fitbit: 'Fitbit',
  apple_health: 'Apple Health', samsung_health: 'Samsung Health', mock: 'Demo Data', not_synced: 'Not synced',
};

function Skeleton() {
  return <div className="h-8 w-24 rounded-lg bg-white/10 animate-pulse" />;
}

function timeAgo(isoString: string | null): string {
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
  if (score === null) return "—";
  if (score >= 85) return "Optimal";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  return "Low";
}

export default function VitalsPage() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const uid = user?.uid || "test-user";
      const data = await api.getLatestWearable(uid);
      setVitals(data);
    } catch (err) {
      console.error("Failed to fetch wearable vitals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVitals(); }, [user]);

  const notSynced = !vitals || vitals.source === "not_synced";
  const hr = vitals?.heart_rate;
  const hrv = vitals?.hrv;
  const sleepHrs = vitals?.sleep_hours;
  const sleepScore = vitals?.sleep_score;
  const readiness = vitals?.readiness_score;
  const sourceLabel = SOURCE_LABELS[vitals?.source] ?? vitals?.source ?? "Unknown";

  // Build HRV chart data — use real hrv point as today if available
  const hrvChartData = hrv
    ? [...FALLBACK_HRV.slice(0, 6), { date: 'Today', hrv: Math.round(hrv) }]
    : FALLBACK_HRV;

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-primary" /> Vitals &amp; Recovery
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Vitals synced from your smartwatch or fitness band via connected platform APIs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!notSynced && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                {sourceLabel} · {timeAgo(vitals?.timestamp)}
              </span>
            )}
            <button
              onClick={fetchVitals}
              className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </header>

        {/* Empty state */}
        {!loading && notSynced && (
          <div className="card flex flex-col items-center justify-center gap-4 py-16 text-center">
            <WifiOff className="w-12 h-12 text-muted-foreground opacity-40" />
            <div>
              <p className="font-bold text-lg">No wearable data yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect a platform in Settings to start syncing vitals from your smartwatch or band.
              </p>
            </div>
            <Link href="/settings" className="btn-primary px-6 py-2 text-sm mt-2">
              Connect a Wearable
            </Link>
          </div>
        )}

        {/* Metric cards */}
        {(loading || !notSynced) && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Resting HR */}
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  <span className="badge badge-rose text-[10px]">Resting HR</span>
                </div>
                {loading ? <Skeleton /> : (
                  <>
                    <div className="text-3xl font-black font-mono-numbers text-rose-500">
                      {hr !== null && hr !== undefined ? Math.round(hr) : "—"}
                      <span className="text-sm text-muted-foreground"> bpm</span>
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
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="badge badge-blue text-[10px]">HRV</span>
                </div>
                {loading ? <Skeleton /> : (
                  <>
                    <div className="text-3xl font-black font-mono-numbers text-primary">
                      {hrv !== null && hrv !== undefined ? Math.round(hrv) : "—"}
                      <span className="text-sm text-muted-foreground"> ms</span>
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
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <span className="badge badge-purple text-[10px]">Sleep Score</span>
                </div>
                {loading ? <Skeleton /> : (
                  <>
                    <div className="text-3xl font-black font-mono-numbers text-indigo-400">
                      {sleepScore !== null && sleepScore !== undefined ? sleepScore : "—"}
                      <span className="text-sm text-muted-foreground"> /100</span>
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
              <div className="card">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card space-y-4">
                <h3 className="font-bold text-lg">Heart Rate Variability (HRV) Trend</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  A rising HRV indicates your autonomic nervous system is recovering well. Today's value is from your last wearable sync.
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hrvChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#2563eb" strokeWidth={4} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card bg-primary/10 border-primary/20">
                  <h3 className="font-bold text-primary mb-2">Connected Wearable Platforms</h3>
                  <div className="space-y-3 mt-4">
                    {[
                      { key: 'setting_google_fit', label: 'Google Fit' },
                      { key: 'setting_apple_health', label: 'Apple Health' },
                      { key: 'setting_garmin', label: 'Garmin Connect' },
                      { key: 'setting_fitbit', label: 'Fitbit' },
                      { key: 'setting_oura', label: 'Oura Ring' },
                    ].map(({ key, label }) => {
                      const enabled = localStorage.getItem(key) !== 'false'
                        && localStorage.getItem(key) !== null
                        ? localStorage.getItem(key) === 'true'
                        : (key === 'setting_google_fit' || key === 'setting_apple_health');
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-border'}`} />
                            {label}
                          </div>
                          <Link href="/settings" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            {enabled ? (vitals?.source?.replace('_', ' ') === label.toLowerCase() ? timeAgo(vitals?.timestamp) : 'Enabled') : 'Connect →'}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card space-y-3">
                  <h3 className="font-bold border-b border-border pb-2">Metric Definitions</h3>
                  <div>
                    <strong className="text-sm block">Heart Rate Variability (HRV)</strong>
                    <p className="text-xs text-muted-foreground">Measures autonomic nervous system balance. Higher HRV = better recovery capacity.</p>
                  </div>
                  <div>
                    <strong className="text-sm block">Resting HR</strong>
                    <p className="text-xs text-muted-foreground">Elevated resting HR signals systemic fatigue or impending illness — reduce training load.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


const HRV_DATA = [
  { date: 'Mon', hrv: 45 },
  { date: 'Tue', hrv: 42 },
  { date: 'Wed', hrv: 55 },
  { date: 'Thu', hrv: 60 },
  { date: 'Fri', hrv: 58 },
  { date: 'Sat', hrv: 65 },
  { date: 'Sun', hrv: 62 },
];

export default function VitalsPage() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-primary" /> Vitals & Recovery
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Vitals synced from your smartwatch or fitness band via connected platform APIs.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              <span className="badge badge-rose text-[10px]">Resting HR</span>
            </div>
            <div className="text-3xl font-black font-mono-numbers text-rose-500">52 <span className="text-sm text-muted-foreground">bpm</span></div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-emerald-500" /> -2 bpm this week</div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="badge badge-blue text-[10px]">HRV</span>
            </div>
            <div className="text-3xl font-black font-mono-numbers text-primary">62 <span className="text-sm text-muted-foreground">ms</span></div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> +12% this week</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="badge badge-purple text-[10px]">Sleep Score</span>
            </div>
            <div className="text-3xl font-black font-mono-numbers text-indigo-400">88 <span className="text-sm text-muted-foreground">/100</span></div>
            <div className="text-xs text-muted-foreground mt-2">7h 45m total sleep</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <Battery className="w-5 h-5 text-emerald-500" />
              <span className="badge badge-green text-[10px]">Readiness</span>
            </div>
            <div className="text-3xl font-black font-mono-numbers text-emerald-500">Optimal</div>
            <div className="text-xs text-muted-foreground mt-2">Cleared for heavy load</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card space-y-4">
            <h3 className="font-bold text-lg">Heart Rate Variability (HRV) Trend</h3>
            <p className="text-sm text-muted-foreground mb-4">A rising HRV indicates your autonomic nervous system is recovering well from surgical trauma and training loads.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={HRV_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#2563eb" strokeWidth={4} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-primary/10 border-primary/20">
              <h3 className="font-bold text-primary mb-2">Connected Wearable Platforms</h3>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Google Fit</div>
                  <span className="text-xs text-muted-foreground">Synced 2m ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500" /> HealthifyMe (Nutrition)</div>
                  <span className="text-xs text-muted-foreground">Synced 1h ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hevy (Workouts)</div>
                  <span className="text-xs text-muted-foreground">Synced 4h ago</span>
                </div>
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="font-bold border-b border-border pb-2">Metric Definitions</h3>
              <div>
                <strong className="text-sm block">Heart Rate Variability (HRV)</strong>
                <p className="text-xs text-muted-foreground">Measures the balance between your sympathetic (fight or flight) and parasympathetic (rest and digest) nervous systems. A higher HRV indicates better tissue recovery.</p>
              </div>
              <div>
                <strong className="text-sm block">Resting HR</strong>
                <p className="text-xs text-muted-foreground">An elevated resting heart rate can indicate systemic fatigue or an impending illness, signaling you to reduce training load.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
