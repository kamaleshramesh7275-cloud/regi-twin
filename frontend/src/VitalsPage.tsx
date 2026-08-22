import React from "react";
import { Sidebar } from "./components/Sidebar";
import { HeartPulse, TrendingUp, TrendingDown, Activity, Battery, Moon, RefreshCcw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

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
            <p className="text-muted-foreground text-sm mt-1">Systemic fatigue and baseline health metrics synced from your wearables.</p>
          </div>
          <button className="btn-secondary flex items-center gap-2 px-4 py-2">
            <RefreshCcw className="w-4 h-4" /> Force Sync
          </button>
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
              <h3 className="font-bold text-primary mb-2">Connected Integration Sources</h3>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-border" /> Oura Ring</div>
                  <span className="text-xs font-bold text-primary cursor-pointer hover:underline">Connect</span>
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
