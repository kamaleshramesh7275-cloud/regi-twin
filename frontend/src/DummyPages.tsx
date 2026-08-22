import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Activity, Camera, History, Clock, Brain, Settings, Trophy, AlertCircle, TrendingUp, CheckCircle2, ChevronRight, ActivitySquare, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { api } from "./api";
import { auth } from "./firebase";
import { Sidebar } from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";

const DEMO_TIMELINE = [
  { day: "Today", events: [{ time: "08:30 AM", type: "Sync", title: "Hevy App Sync", desc: "Heavy Squat Day • 12,400 lbs total volume", status: "success" }] },
  { day: "Yesterday", events: [{ time: "09:00 AM", type: "Sync", title: "HealthifyMe Sync", desc: "165g Protein • 2,400 kcal", status: "success" }] },
];
const DEMO_INSIGHTS = [{ type: 'warning', title: 'Systemic Fatigue', desc: 'HRV dropped to 45ms. Avoid heavy lifting today.' }];
const DEMO_MILESTONES = [{ title: "Perfect Posture", date: "Jul 15, 2026", icon: <User className="w-5 h-5 text-emerald-400" /> }];
const DEMO_RECORDS = [{ label: "Max Mobility", value: "94", date: "Jul 10, 2026" }];
const DEMO_DOMAIN_SCORES = [{ name: 'Mobility', score: 85 }];
const DEMO_ACTION_PLAN = [{ phase: "Phase 1", tasks: ["Foam roll calves", "Banded glute bridges"] }];

const isDemoMode = () => false;

export function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  // Pain Logger States
  const [painLogs, setPainLogs] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState('left_knee');
  const [painScore, setPainScore] = useState(5);
  const [loggingPain, setLoggingPain] = useState(false);

  const fetchPainLogs = async () => {
    try {
      const uid = auth.currentUser?.uid || "test-user";
      const logs = await api.getPainHistory(uid);
      setPainLogs(logs);
    } catch (err) {
      console.error("Error fetching pain history", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const uid = auth.currentUser?.uid || "test-user";
      let data = await api.getSessionHistory(uid);
      if (!data || data.length === 0) {
        data = [
          { id: '1', task_type: 'Sit-to-Stand Assessment', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), rom: 85.2, symmetry: 0.95, movement_speed: 15.4, stability: 0.88 },
          { id: '2', task_type: 'Static Posture', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), rom: 90.1, symmetry: 0.98, movement_speed: 0, stability: 0.92 },
          { id: '3', task_type: 'Sit-to-Stand Assessment', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), rom: 82.4, symmetry: 0.91, movement_speed: 14.1, stability: 0.85 },
        ];
      }
      setSessions(data);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchPainLogs();
  }, []);

  const handleLogPain = async () => {
    setLoggingPain(true);
    try {
      const uid = auth.currentUser?.uid || "test-user";
      await api.logPain(uid, { zone: selectedZone, score: painScore });
      await fetchPainLogs();
    } catch (err) {
      console.error("Error logging pain", err);
    } finally {
      setLoggingPain(false);
    }
  };

  const filteredSessions = filter === 'All' ? sessions : sessions.filter(s => s.task_type.includes(filter));
  
  // KPIs
  const avgRom = sessions.length ? sessions.reduce((acc, s) => acc + s.rom, 0) / sessions.length : 0;
  const bestSym = sessions.length ? Math.max(...sessions.map(s => s.symmetry)) : 0;
  const avgStab = sessions.length ? sessions.reduce((acc, s) => acc + s.stability, 0) / sessions.length : 0;

  // Format pain history for chart
  const painChartData = painLogs.map((l: any) => ({
    date: new Date(l.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: l.score,
    zone: l.zone.replace('_', ' ').toUpperCase()
  }));

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-6 space-y-6 anim-fade relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2"><History className="w-6 h-6 text-primary" /> Session History</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Your past physical capability logs</p>
          </div>
          <Link href="/capture" className="btn-primary py-2 px-4 text-xs whitespace-nowrap hidden md:flex">Start New Session</Link>
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 glass-panel pointer-events-auto">
            <History className="w-12 h-12 text-muted-foreground opacity-30" />
            <div className="text-muted-foreground">No sessions recorded yet.</div>
            <Link href="/capture" className="btn-primary mt-2">Start a Session</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 anim-up-d1 pointer-events-auto">
              <div className="glass-panel text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Sessions</div>
                <div className="text-2xl font-bold">{sessions.length}</div>
              </div>
              <div className="glass-panel text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg ROM</div>
                <div className="text-2xl font-bold text-sky-500">{avgRom.toFixed(1)}°</div>
              </div>
              <div className="glass-panel text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Best Symmetry</div>
                <div className="text-2xl font-bold text-emerald-500">{(bestSym * 100).toFixed(0)}%</div>
              </div>
              <div className="glass-panel text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Stability</div>
                <div className="text-2xl font-bold text-amber-500">{(avgStab * 100).toFixed(0)}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['All', 'Sit-to-Stand', 'Posture', 'Balance', 'Gait'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-secondary text-foreground hover:bg-primary/20'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pointer-events-auto">
              {/* Left Column (2/3 width) - Session List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSessions.map((session, i) => (
                    <div key={session.id || i} className="glass-panel hover:border-primary/50 transition-colors relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-lg">{session.task_type}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(session.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {session.badge && (
                          <div className={`badge text-[10px] ${
                            session.badge === 'Personal Best' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            session.badge === 'Watchpoint' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {session.badge === 'Personal Best' && <Trophy className="w-3 h-3 mr-1" />}
                            {session.badge === 'Watchpoint' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {session.badge === 'Improved' && <TrendingUp className="w-3 h-3 mr-1" />}
                            {session.badge}
                          </div>
                        )}
                      </div>
                      
                      {session.notes && (
                        <div className="text-xs italic text-muted-foreground mb-4 bg-secondary/50 p-2 rounded border border-border/50">
                          "{session.notes}"
                        </div>
                      )}

                      {session.annotated_image_url && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-border">
                          <img src={session.annotated_image_url} alt="Annotated Capture" className="w-full h-auto object-cover max-h-48" />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Range of Motion</div>
                          <div className="font-mono-numbers font-bold text-xl">{(session.rom || 0).toFixed(1)}°</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex justify-between">
                            <span>Symmetry</span>
                            <span className="font-mono-numbers">{((session.symmetry || 0) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(session.symmetry || 0) * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Speed (Reps/Min)</div>
                          <div className="font-mono-numbers font-bold text-xl">{(session.movement_speed || 0).toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex justify-between">
                            <span>Stability</span>
                            <span className="font-mono-numbers">{((session.stability || 0) * 100).toFixed(0)}</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(session.stability || 0) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column (1/3 width) - Pain Logger Widget & Trend Chart */}
              <div className="space-y-6">
                <div className="card space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Subjective Pain Logger</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Joint Region</label>
                      <select 
                        value={selectedZone}
                        onChange={e => setSelectedZone(e.target.value)}
                        className="w-full bg-secondary text-foreground text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary border border-border"
                      >
                        <option value="left_knee">Left Knee</option>
                        <option value="right_knee">Right Knee</option>
                        <option value="lumbar">Lumbar Spine</option>
                        <option value="cervical">Cervical Spine</option>
                        <option value="left_shoulder">Left Shoulder</option>
                        <option value="right_shoulder">Right Shoulder</option>
                        <option value="left_ankle">Left Ankle</option>
                        <option value="right_ankle">Right Ankle</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Intensity Scale</span>
                        <span className="font-bold text-primary">{painScore}/10</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={painScore}
                        onChange={e => setPainScore(parseInt(e.target.value))}
                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                    <button
                      onClick={handleLogPain}
                      disabled={loggingPain}
                      className="btn-primary w-full py-2 text-xs font-bold disabled:opacity-50"
                    >
                      {loggingPain ? "Logging..." : "Submit Pain Log"}
                    </button>
                  </div>
                </div>

                <div className="card space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Pain Trend Overlay</h3>
                  {painLogs.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic text-center py-8">
                      No pain scores logged. Use the form above to begin tracking localized pain.
                    </div>
                  ) : (
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={painChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                          <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} name="Pain Score" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


export function TimelinePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState({ rom: true, symmetry: true, speed: false, stability: false });

  useEffect(() => {
    async function fetchHistory() {
      if (isDemoMode()) {
        setSessions(DEMO_TIMELINE);
        setLoading(false);
        return;
      }
      try {
        const uid = user?.uid || "test-user";
        let data = await api.getSessionHistory(uid);
        
        if (!data || data.length < 2) {
          data = Array.from({length: 10}).map((_, i) => ({
             id: `mock-${i}`,
             timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * (10 - i)).toISOString(),
             rom: 75 + (i * 1.5) + (Math.random() * 5 - 2.5),
             symmetry: 0.85 + (i * 0.01) + (Math.random() * 0.02 - 0.01),
             movement_speed: 12 + (i * 0.5),
             stability: 0.80 + (i * 0.01)
          }));
        }
        
        const chartData = data.reverse().map((s: any, idx: number) => ({
          name: `S${idx + 1}`,
          date: new Date(s.timestamp).toLocaleDateString(),
          rom: parseFloat(s.rom.toFixed(1)),
          symmetry: parseFloat((s.symmetry * 100).toFixed(0)),
          speed: parseFloat(s.movement_speed.toFixed(1)),
          stability: parseFloat((s.stability * 100).toFixed(0))
        }));
        setSessions(chartData);
      } catch (err) {
        console.error("Error fetching history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const toggleMetric = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-6 space-y-6 anim-fade relative z-10">
        <header className="pointer-events-auto">
          <h1 className="text-2xl font-black flex items-center gap-2"><Clock className="w-6 h-6 text-primary" /> Twin Timeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Visualize your capability progression</p>
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : sessions.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 glass-panel pointer-events-auto">
            <Clock className="w-12 h-12 text-muted-foreground opacity-30" />
            <div className="text-muted-foreground">Record at least 2 sessions to see your timeline.</div>
            <Link href="/capture" className="btn-primary mt-2">Start a Session</Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-panel anim-up-d2 pointer-events-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Multi-Metric Overlay</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => toggleMetric('rom')} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${activeMetrics.rom ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-transparent text-muted-foreground border-white/10'}`}>ROM</button>
                  <button onClick={() => toggleMetric('symmetry')} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${activeMetrics.symmetry ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-transparent text-muted-foreground border-white/10'}`}>Symmetry</button>
                  <button onClick={() => toggleMetric('stability')} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${activeMetrics.stability ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-transparent text-muted-foreground border-white/10'}`}>Stability</button>
                  <button onClick={() => toggleMetric('speed')} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${activeMetrics.speed ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-transparent text-muted-foreground border-white/10'}`}>Speed</button>
                </div>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" stroke="#94a3b8" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" domain={[0, 40]} tick={{ fontSize: 11 }} hide={!activeMetrics.speed} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10,15,30,0.95)', color: '#f8fafc' }} />
                    
                    {activeMetrics.rom && <Line yAxisId="left" type="monotone" dataKey="rom" name="Range of Motion" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
                    {activeMetrics.symmetry && <Line yAxisId="left" type="monotone" dataKey="symmetry" name="Symmetry" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
                    {activeMetrics.stability && <Line yAxisId="left" type="monotone" dataKey="stability" name="Stability" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
                    {activeMetrics.speed && <Line yAxisId="right" type="monotone" dataKey="speed" name="Speed" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function InsightsPage() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInsights() {
      if (isDemoMode()) {
        setInsights("## Biomechanical Analysis\n\nYour recent kinematic trends show a **steady improvement in right-side symmetry**, particularly during load-bearing transitions.\n\n### Core Findings\n- **Pelvic tracking** has stabilized by 14% over the last 3 sessions.\n- **Knee varus** is still present on the left side during descent. This is contributing to the minor drop in stability metrics.\n\n### Recommended Focus\nContinue eccentric quad control to improve that descent phase and protect the left knee.");
        setLoading(false);
        return;
      }
      try {
        const uid = auth.currentUser?.uid || "test-user";
        const cached = sessionStorage.getItem("lastInsights");
        if (cached) {
          setInsights(cached);
        }
      } catch (err) {
        console.error("Error loading insights", err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = auth.currentUser?.uid || "test-user";
      const res = await api.getDeepInsights(uid);
      setInsights(res.insights);
      sessionStorage.setItem("lastInsights", res.insights || "");
    } catch (err: any) {
      setError(err.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdownText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground">{line.replace(/###/g, '')}</h3>;
      if (line.startsWith('##')) return <h2 key={i} className="text-xl font-black mt-6 mb-3 text-foreground">{line.replace(/##/g, '')}</h2>;
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-2 text-muted-foreground leading-relaxed">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-foreground">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const annotatedImage = sessionStorage.getItem("lastAnnotatedImage");

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-6 space-y-6 anim-fade relative z-10">
        <header className="flex items-center justify-between pointer-events-auto">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> AI Biomechanics Analysis
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Deep insights generated from your motion data</p>
          </div>
          {insights && (
            <button onClick={handleGenerate} disabled={loading} className="text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50">Regenerate</button>
          )}
        </header>

        {!insights && !loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 glass-panel text-center max-w-2xl mx-auto pointer-events-auto">
            <button onClick={handleGenerate} className="btn-primary mt-2 px-8 py-3">Generate Deep Insights</button>
          </div>
        ) : loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {annotatedImage && (
              <div className="mb-6 relative rounded-2xl overflow-hidden border border-border shadow-lg max-w-lg mx-auto">
                <img src={annotatedImage} alt="AI Annotated Posture" className="w-full h-auto" />
                <div className="absolute top-3 right-3 badge badge-cyan shadow-md">
                  <Brain className="w-3 h-3 mr-1" /> Vision Processed
                </div>
              </div>
            )}
            
            <div className="glass-panel anim-up-d2 pointer-events-auto">
              <div className="prose prose-sm md:prose-base">{renderMarkdownText(insights!)}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center gap-4">
        <Settings className="w-16 h-16 text-muted-foreground opacity-50" />
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="text-muted-foreground">User preferences and app configuration.</p>
      </main>
    </div>
  );
}
