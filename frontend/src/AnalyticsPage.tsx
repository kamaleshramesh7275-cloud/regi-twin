import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import {
  LineChart as LineChartIcon, TrendingUp, TrendingDown,
  Activity, Download, RefreshCcw, AlertTriangle
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart, Bar
} from "recharts";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

// Fallback mock data shown when there are no sessions yet
const FALLBACK_CAP = [
  { date: "W1", mobility: 62, stability: 58, recovery: 55, quality: 60 },
  { date: "W2", mobility: 67, stability: 63, recovery: 60, quality: 65 },
  { date: "W3", mobility: 73, stability: 70, recovery: 68, quality: 71 },
  { date: "W4", mobility: 79, stability: 76, recovery: 75, quality: 78 },
];

const FALLBACK_ROM = [
  { date: "Oct 01", rom: 82, symmetry: 74, stability: 68 },
  { date: "Oct 08", rom: 88, symmetry: 79, stability: 73 },
  { date: "Oct 15", rom: 95, symmetry: 85, stability: 80 },
  { date: "Oct 22", rom: 101, symmetry: 90, stability: 86 },
  { date: "Oct 29", rom: 108, symmetry: 94, stability: 91 },
];

const FALLBACK_ZONES = [
  { zone: "Knee Flexion", sessions: 8 },
  { zone: "Hip Stability", sessions: 5 },
  { zone: "Lumbar Mobility", sessions: 4 },
  { zone: "Shoulder ROM", sessions: 3 },
  { zone: "Ankle", sessions: 2 },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const summary = await api.getAnalyticsSummary(user.uid);
      setData(summary);
    } catch (e) {
      setError("Could not load live data. Showing demo data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const romTrend = (data?.rom_trend?.length > 0) ? data.rom_trend : FALLBACK_ROM;
  const capTrend = (data?.capability_trend?.length > 0) ? data.capability_trend : FALLBACK_CAP;
  const painTrend = data?.pain_trend || [];
  const zoneHeatmap = (data?.zone_heatmap?.length > 0) ? data.zone_heatmap : FALLBACK_ZONES;

  // Export CSV
  const handleExport = () => {
    const rows = data?.csv_rows || romTrend;
    const headers = Object.keys(rows[0] || {}).join(",");
    const lines = rows.map((r: any) => Object.values(r).join(","));
    const csv = [headers, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "physiotwin_analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <LineChartIcon className="w-6 h-6 text-primary" /> Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Deep longitudinal biomechanical data visualization.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Row 1: ROM + Capability Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ROM & Symmetry Trend */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg">Range of Motion & Symmetry</h3>
                <p className="text-xs text-muted-foreground">Per-session biomechanical measurements</p>
              </div>
              <div className="text-right">
                {romTrend.length > 1 && (
                  <div className="text-xl font-bold text-emerald-500 flex items-center gap-1 justify-end">
                    <TrendingUp className="w-4 h-4" />
                    +{Math.round((romTrend[romTrend.length - 1].rom - romTrend[0].rom) || 0)}°
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground uppercase">ROM Gained</div>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={romTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }} itemStyle={{ color: "#f8fafc" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="rom" name="ROM (°)" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="symmetry" name="Symmetry (%)" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="stability" name="Stability (%)" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg border border-border/50">
              <strong className="text-primary block mb-1">Clinical Reasoning:</strong>
              Achieving symmetrical ROM within 6 weeks prevents arthrofibrosis. Track the gap between ROM and symmetry — a closing gap indicates balanced bilateral adaptation.
            </div>
          </div>

          {/* Capability Score Trends */}
          <div className="card space-y-4">
            <div>
              <h3 className="font-bold text-lg">Capability Score Trends</h3>
              <p className="text-xs text-muted-foreground">Mobility, Stability, Recovery, Quality over time</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={capTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    {["mobility", "stability", "recovery", "quality"].map((k, i) => (
                      <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={["#2563eb","#10b981","#8b5cf6","#f59e0b"][i]} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={["#2563eb","#10b981","#8b5cf6","#f59e0b"][i]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="mobility" name="Mobility" stroke="#2563eb" fill="url(#grad_mobility)" strokeWidth={2} />
                  <Area type="monotone" dataKey="stability" name="Stability" stroke="#10b981" fill="url(#grad_stability)" strokeWidth={2} />
                  <Area type="monotone" dataKey="recovery" name="Recovery" stroke="#8b5cf6" fill="url(#grad_recovery)" strokeWidth={2} />
                  <Area type="monotone" dataKey="quality" name="Quality" stroke="#f59e0b" fill="url(#grad_quality)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Pain Overlay + Zone Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pain vs ROM Overlay */}
          <div className="card space-y-4">
            <div>
              <h3 className="font-bold text-lg">Pain Score Trend</h3>
              <p className="text-xs text-muted-foreground">Subjective pain log by body zone</p>
            </div>
            {painTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                <Activity className="w-8 h-8 opacity-30" />
                No pain logs recorded yet. Log your pain on the History page.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={painTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="score" name="Pain Score" fill="#ef4444" opacity={0.7} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="score" name="Trend" stroke="#f87171" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg border border-border/50">
              <strong className="text-primary block mb-1">Clinical Reasoning:</strong>
              Pain scores above 7/10 for more than 3 consecutive days indicate a load management issue and warrant physiotherapy review.
            </div>
          </div>

          {/* Session Zone Heatmap (Radar) */}
          <div className="card space-y-4">
            <div>
              <h3 className="font-bold text-lg">Session Zone Distribution</h3>
              <p className="text-xs text-muted-foreground">Which body zones have been most exercised</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={zoneHeatmap} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="zone" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Radar name="Sessions" dataKey="sessions" stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} strokeWidth={2} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {zoneHeatmap.map((z: any) => (
                <span key={z.zone} className="text-xs px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  {z.zone}: <strong>{z.sessions}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
