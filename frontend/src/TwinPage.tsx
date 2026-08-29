import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, Camera, History, Clock, Brain, Settings, User,
  AlertTriangle, TrendingUp, TrendingDown,
  ChevronRight, ChevronLeft, BarChart2, Target, ShieldAlert
} from "lucide-react";
import HoloModel3D from "./HoloModel3D";
import { Sidebar } from "./components/Sidebar";
import type { ZoneId, ZoneRisk } from "./HoloModel3D";
import { useAuth } from "./context/AuthContext";
import { fetchGoogleFitData } from "./lib/googleFitApi";
import { api } from "./api";

// ── Zone risk colour helpers ───────────────────────────────
function riskLabel(r: number) { return r < 35 ? "Healthy" : r < 55 ? "Watch" : r < 70 ? "Elevated" : "Critical"; }
function riskColor(r: number) { return r < 35 ? "#10b981" : r < 55 ? "#f59e0b" : r < 70 ? "#f97316" : "#ef4444"; }
function riskBg(r: number)    { return r < 35 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : r < 55 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : r < 70 ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"; }
function overallScore(risk: ZoneRisk) {
  const vals = Object.values(risk).filter(v => v !== undefined) as number[];
  return vals.length ? Math.max(0, Math.round(100 - vals.reduce((a, b) => a + b, 0) / vals.length)) : 0;
}

// ── ALL zone IDs ──────────────────────────────────────────
const ALL_ZONES: ZoneId[] = [
  "head","neck","chest","lumbar","left_shoulder","right_shoulder",
  "left_arm","right_arm","left_forearm","right_forearm",
  "left_hip","right_hip","left_thigh","right_thigh",
  "left_knee","right_knee","left_shin","right_shin","left_ankle","right_ankle",
];

// ── Data types ────────────────────────────────────────────
type SessionData    = { session: number; date: string; label: string; zones: ZoneRisk };
type ProjectionFrame = { horizon: string; months: number; zones: ZoneRisk; withTreatment: ZoneRisk };

const LEADERBOARD_DATA = [
  { rank: 1, name: "Marcus T.", mark: 890, age: 31, tier: "Platinum" },
  { rank: 2, name: "Sarah J.", mark: 845, age: 29, tier: "Gold" },
  { rank: 3, name: "David O.", mark: 820, age: 30, tier: "Gold" },
  { rank: 48, name: "Elena R.", mark: 690, age: 32, tier: "Silver" },
];

// ── Zone metadata (injuries, causes, actions) ─────────────
const DETAILED_ZONE_META: Partial<Record<ZoneId, { label:string; injuries:string[]; rootCause:string; immediateAction:string; longTermRisk:string }>> = {
  left_knee:      { label:"Left Knee",      injuries:["Patellofemoral Stress","Valgus Overload"],  rootCause:"Quad weakness + hip abductor deficit causing 4.2° varus angle during loading.", immediateAction:"Eccentric quad protocol (3×10 step-downs). Ice 15 min post-session.", longTermRisk:"Without intervention: medial compartment OA onset risk within 18 months." },
  right_knee:     { label:"Right Knee",     injuries:["Moderate Valgus Stress"],                   rootCause:"Compensatory loading from left-side weakness increasing right knee joint force.", immediateAction:"Hip abductor strengthening — clamshells 3×15, side-lying leg raises.", longTermRisk:"Risk escalates to match left knee severity within 3 months if untreated." },
  lumbar:         { label:"Lower Back",     injuries:["Lumbar Instability","Flexion Intolerance"], rootCause:"Core bracing deficit (48%). Excessive anterior pelvic tilt in 6 of 8 sessions.", immediateAction:"Dead bug 3×10, prone cobra 3×15. Avoid loaded flexion.", longTermRisk:"Progressive disc loading risk. Probable L4/L5 irritation at current trajectory." },
  left_hip:       { label:"Left Hip",       injuries:["Hip Flexor Tightness"],                     rootCause:"Prolonged sitting + hip capsule restriction detected in movement pattern.", immediateAction:"Hip 90/90 stretch 2×60s each side. Couch stretch daily.", longTermRisk:"Primary contributor to knee valgus and lumbar instability." },
  right_hip:      { label:"Right Hip",      injuries:["Mild Hip Tightness"],                       rootCause:"Bilateral tightness. Right side within normal range.", immediateAction:"Pigeon pose 45s. Maintain bilateral mobility routine.", longTermRisk:"Low immediate risk. Monitor for asymmetry increase." },
  left_shoulder:  { label:"Left Shoulder",  injuries:["Rotator Cuff Fatigue"],                     rootCause:"Left arm generates 12% less force than right — overhead loading imbalance.", immediateAction:"External rotation banding 3×15, face pulls 3×20.", longTermRisk:"Rotator cuff strain risk within 2 months if load increases." },
  right_shoulder: { label:"Right Shoulder", injuries:["Dominant side mild overuse"],               rootCause:"Right shoulder compensating for left. Load symmetry 94%.", immediateAction:"Maintain current strengthening. Monitor symmetry weekly.", longTermRisk:"Stable. No significant escalation expected." },
  chest:          { label:"Chest",          injuries:["Pec tightness"],                            rootCause:"Upper-cross syndrome pattern. Rounded shoulder posture detected.", immediateAction:"Doorway stretch 3×30s. Thoracic extension over foam roller.", longTermRisk:"Will worsen shoulder and neck symptoms if uncorrected." },
  neck:           { label:"Neck",           injuries:["Forward Head Posture"],                     rootCause:"1.5cm anterior head shift. Linked to screen habits.", immediateAction:"Chin tucks 3×10, deep neck flexor strengthening.", longTermRisk:"Cervicogenic headache risk increases without postural correction." },
  left_thigh:     { label:"Left Thigh",     injuries:["Quad Strength Deficit"],                    rootCause:"Left quad at 68% of right-side force — significant asymmetry.", immediateAction:"Eccentric step-downs left side, single-leg press 3×12.", longTermRisk:"Primary driver of left knee valgus. Priority for intervention." },
  right_thigh:    { label:"Right Thigh",    injuries:["Compensatory Load"],                        rootCause:"Compensating for left deficit. Load within acceptable range.", immediateAction:"Continue bilateral strengthening.", longTermRisk:"Stable if left side improves." },
};

const ZONE_META: Record<string, { label: string, desc: string, icon: any }> = {
  left_knee: { label: "L. Knee", desc: "Patellar tracking issue detected. Increased valgus stress on descent.", icon: Activity },
  right_knee: { label: "R. Knee", desc: "Stable. Good force distribution.", icon: Activity },
  lumbar: { label: "Lumbar", desc: "Mild flexion during deep squats. Monitor load.", icon: Target },
  cervical: { label: "Cervical", desc: "Forward head posture improved.", icon: Activity },
  left_shoulder: { label: "L. Shoulder", desc: "Optimal mobility. Impingement risk low.", icon: Activity },
  right_shoulder: { label: "R. Shoulder", desc: "Slight restriction in external rotation.", icon: Activity },
  left_ankle: { label: "L. Ankle", desc: "Dorsiflexion limited. Compensating via early heel rise.", icon: AlertTriangle },
  right_ankle: { label: "R. Ankle", desc: "Normal ROM.", icon: Activity },
  left_hip: { label: "L. Hip", desc: "Good internal rotation.", icon: Activity },
  right_hip: { label: "R. Hip", desc: "Tight hip flexors detected.", icon: Target },
};

function ScoreRing({ score, size }: { score: number, size: number }) {
  const norm = Math.max(0, Math.min(1000, score)) / 1000;
  const stroke = 3.5;
  const rad = (size - stroke) / 2;
  const circ = 2 * Math.PI * rad;
  const offset = circ - (norm * circ);
  let color = "#10b981";
  if (score < 500) color = "#ef4444";
  else if (score < 750) color = "#f59e0b";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/10" />
        <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="text-center z-10">
        <div className="font-black font-mono leading-none" style={{ fontSize: size * 0.22 }}>{score}</div>
        <div className="text-muted-foreground uppercase tracking-widest" style={{ fontSize: size * 0.09 }}>Score</div>
      </div>
    </div>
  );
}

// ══ MAIN PAGE ═════════════════════════════════════════════
export default function TwinPage() {
  const [location] = useLocation();
  const rawMode = location.replace('/', '') as "twin"|"history"|"projection";
  const mode = rawMode === "twin" ? "active" : rawMode;

  const { user, googleFitToken } = useAuth();
  
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [histCursor, setHistCursor]     = useState(0);
  const [showTreatment, setShowTreatment] = useState(false);
  const [syncedData, setSyncedData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projIdx, setProjIdx] = useState<number>(0);

  const [liveRisk, setLiveRisk] = useState<ZoneRisk>({
    left_knee: 0, right_knee: 0, lumbar: 0, neck: 0, left_shoulder: 0, right_shoulder: 0, left_ankle: 0, right_ankle: 0, left_hip: 0, right_hip: 0
  });
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [projections, setProjections] = useState<ProjectionFrame[]>([]);

  // Fetch Dashboard, History, and Projections from real API
  useEffect(() => {
    const loadData = async () => {
      try {
        const uid = user?.uid || "demo_user";
        const [dash, hist, proj] = await Promise.all([
          api.getDashboard(uid).catch(e => { console.error(e); return { zone_risks: {} }; }),
          api.getSessionHistory(uid).catch(e => { console.error(e); return []; }),
          api.getDynamicProjections(uid).catch(e => { console.error(e); return []; }),
        ]);
        if (dash.zone_risks) {
          setLiveRisk(dash.zone_risks);
        }
        if (hist && hist.length > 0) {
          setHistoryData(hist.reverse()); // Chronological
          setHistCursor(hist.length - 1);
        }
        if (proj && proj.length > 0) {
          setProjections(proj);
        }
      } catch (e) {
        console.error("Failed to fetch Twin data", e);
      }
    };
    loadData();
  }, [user]);

  const [dynamicRisk, setDynamicRisk] = useState<ZoneRisk | null>(null);

  const handleSyncFit = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchGoogleFitData(googleFitToken || "dummy_simulation_token");
      const updatedRisk = await api.calculateDynamicRisk(liveRisk, data);
      
      // Sync the parsed Hevy/HealthifyMe data to the backend for the Dashboard to use
      const uid = user?.uid || "demo_user";
      await api.syncExternalApps(uid, data.workouts, data.nutrition);

      // Fix 5: Persist wearable vitals to wearable_sessions so VitalsPage and
      // the analytics engine can use real HR/HRV data instead of hardcoded values.
      if (data.liveVitals) {
        await api.syncWearableData(uid, {
          source: data.source === "Google Fit API" ? "google_fit" : "mock",
          heart_rate: data.liveVitals.heartRate ?? undefined,
          steps: data.liveVitals.steps ?? undefined,
          // hrv, spo2, sleep_hours are enriched from platform API when available
          hrv: undefined,
          spo2: undefined,
          sleep_hours: undefined,
          sleep_score: undefined,
          readiness_score: undefined,
          calories_burned: undefined,
          active_minutes: undefined,
        });
      }
      
      setDynamicRisk(updatedRisk);
      setSyncedData(data);
    } catch (e) {
      console.error(e);
      alert("Failed to sync data.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Real projections from API (falls back to empty array until loaded)
  const activeProjections: ProjectionFrame[] = projections.length > 0 ? projections : [];

  const currentHistoryItem = historyData.length > 0 ? historyData[histCursor] : null;

  const displayRisk: ZoneRisk =
    mode === "active"     ? (dynamicRisk || liveRisk) :
    mode === "history"    ? (currentHistoryItem ? { ...liveRisk, left_knee: currentHistoryItem.rom < 85 ? 80 : 40 } : liveRisk) :
    activeProjections.length > 0
      ? (showTreatment ? activeProjections[projIdx].withTreatment : activeProjections[projIdx].zones)
      : liveRisk;

  const score      = overallScore(displayRisk);
  const zoneMeta   = selectedZone ? DETAILED_ZONE_META[selectedZone as ZoneId] : undefined;
  const basicMeta  = selectedZone ? ZONE_META[selectedZone] : undefined;
  const zoneRisk   = selectedZone ? (displayRisk[selectedZone] ?? 0) : 0;

  const topRisk = ALL_ZONES
    .map(id => ({ id, risk: liveRisk[id] ?? 0 }))
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 5);

  const modeLabel =
    mode === "active"     ? "Active Sync" :
    mode === "history"    ? `Session ${histCursor + 1} — ${currentHistoryItem?.timestamp ? new Date(currentHistoryItem.timestamp).toLocaleDateString() : "—"}` :
    activeProjections.length > 0
      ? `${activeProjections[projIdx].horizon} ${showTreatment ? "(w/ treatment)" : "(no treatment)"}`
      : "Projection Loading...";

  return (
    <div className="relative w-full h-screen text-foreground overflow-hidden bg-black font-sans">
      
      {/* ── 3D GLB Model ── */}
      <HoloModel3D 
        riskData={displayRisk}
        selectedZone={selectedZone}
        onZoneClick={(id) => setSelectedZone(prev => prev === id ? null : id)}
      />

      <Sidebar />

      {/* ── Floating Controls Layer ── */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col md:flex-row md:pl-60">
        
        {/* Main Center Area (Controls overlay) */}
        <div className="flex-1 flex flex-col relative pointer-events-none">
          
          <div className="pointer-events-auto flex items-center justify-end p-6 shrink-0 mt-4 mx-4">
            
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl pr-2 pl-4 py-1.5 shadow-2xl">
              <div className="text-right">
                <div className="text-[11px] font-medium text-muted-foreground">{modeLabel}</div>
                <div className="text-sm font-black">Twin Score</div>
              </div>
              <ScoreRing score={score} size={54} />
            </div>
          </div>

          <div className="flex-1" />

          {/* Bottom scrubbers */}
          {mode === "history" && (
            <div className="pointer-events-auto m-6 p-5 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-3">
                <span>{historyData.length > 0 ? new Date(historyData[0].timestamp).toLocaleDateString() : "Start"}</span>
                <span className="text-white text-sm bg-white/10 px-3 py-1 rounded-full">
                  Session {histCursor + 1}{currentHistoryItem?.task_type ? ` — ${currentHistoryItem.task_type}` : ""}
                </span>
                <span>{historyData.length > 0 ? new Date(historyData[historyData.length-1].timestamp).toLocaleDateString() : "Now"}</span>
              </div>
              <input type="range" min={0} max={Math.max(0, historyData.length-1)} value={histCursor}
                onChange={e => setHistCursor(Number(e.target.value))} className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" />
            </div>
          )}

          {mode === "projection" && (
            <div className="pointer-events-auto m-6 p-4 bg-background/80 backdrop-blur-2xl border border-border/50 rounded-2xl flex flex-wrap items-center gap-4 justify-center">
              <div className="flex gap-2 bg-secondary/30 rounded-xl p-1 border border-border/40">
                {activeProjections.map((p, i) => (
                  <button key={i} onClick={() => setProjIdx(i)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all
                      ${projIdx===i ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                    {p.horizon}
                  </button>
                ))}
              </div>
              <div className="w-px h-8 bg-border/50" />
              <button onClick={() => setShowTreatment(p => !p)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-lg text-sm font-medium border transition-all
                  ${showTreatment
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : "bg-secondary/20 border-border/40 text-muted-foreground hover:text-foreground"}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${showTreatment ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                {showTreatment ? "With Physio Treatment" : "No Treatment (Decline)"}
              </button>
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <aside className="pointer-events-auto w-full md:w-[380px] bg-black/40 backdrop-blur-2xl border-l border-white/10 flex flex-col md:overflow-y-auto shrink-0 shadow-2xl">
          {/* ACTIVE MODE */}
          {mode === "active" && (
            <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
              
              <div className="mb-6 flex flex-col gap-2">
                <button 
                  onClick={handleSyncFit}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 py-3 rounded-xl font-bold hover:bg-[#10b981]/30 transition-colors disabled:opacity-50"
                >
                  <Activity className="w-4 h-4" />
                  {isSyncing ? "Syncing Data..." : "Sync Google Fit Data"}
                </button>
                {syncedData && (
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-muted-foreground">
                    <p><strong className="text-white">Recent Workout:</strong> {syncedData.workouts[0]?.app} - {syncedData.workouts[0]?.name}</p>
                    <p><strong className="text-white">Nutrition:</strong> {syncedData.nutrition.app} - {syncedData.nutrition.status} ({syncedData.nutrition.protein})</p>
                    <p className="mt-1 text-[#f59e0b]">Dynamic Risk Adjusted for Recovery!</p>
                  </div>
                )}
              </div>

              {(zoneMeta || basicMeta) ? (
                <div className="anim-up">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-black text-xl tracking-tight">{zoneMeta?.label || basicMeta?.label || selectedZone}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${riskBg(zoneRisk)}`}>{riskLabel(zoneRisk)}</span>
                        <span className="font-mono text-lg font-black" style={{ color: riskColor(zoneRisk) }}>{zoneRisk}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedZone(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">✕</button>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full mb-6 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width:`${zoneRisk}%`, background:riskColor(zoneRisk) }} />
                  </div>
                  
                  {zoneMeta?.injuries && zoneMeta.injuries.length > 0 && (
                    <div className="mb-5">
                      <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Active Issues</div>
                      {zoneMeta.injuries.map(inj => (
                        <div key={inj} className="flex items-center gap-3 text-sm font-medium mb-1.5 bg-white/5 px-3 py-2 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" /><span>{inj}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    {zoneMeta?.rootCause && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" /> Diagnostic Reasoning (Hevy Data)
                        </div>
                        <p className="text-sm text-amber-100/70 leading-relaxed">
                          {zoneMeta.rootCause} <br/><br/>
                          <span className="text-amber-400 font-semibold">Hevy Log Correlation:</span> Your recent jump in heavy squat volume (+15% load) has outpaced tendon adaptation.
                        </p>
                      </div>
                    )}
                    {zoneMeta?.immediateAction && (
                      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5" /> Clinical Immediate Action
                        </div>
                        <p className="text-sm text-blue-100/70 leading-relaxed">{zoneMeta.immediateAction}</p>
                      </div>
                    )}
                    {zoneMeta?.longTermRisk && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                        <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5">Long-Term Risk if Ignored</div>
                        <p className="text-sm text-red-100/70 leading-relaxed">{zoneMeta.longTermRisk}</p>
                      </div>
                    )}
                    {!zoneMeta && basicMeta && (
                       <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                         <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Zone Overview</div>
                         <p className="text-sm text-white/70 leading-relaxed">{basicMeta.desc}</p>
                       </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Highest Risk Zones</div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Select any glowing red body part on the 3D model, or pick from the list below to see injury root causes and treatment plans.</p>
                  <div className="space-y-2">
                    {topRisk.map(({ id, risk }) => (
                      <button key={id} onClick={() => setSelectedZone(id)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-sm text-left transition-all border border-transparent hover:border-white/10">
                        <div className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_10px_currentColor]" style={{ background:riskColor(risk), color:riskColor(risk) }} />
                        <span className="flex-1 font-bold">{ZONE_META[id]?.label ?? id.replace(/_/g," ")}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg" style={{ color:riskColor(risk) }}>{risk}</span>
                          {risk >= 70 ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <TrendingUp className="w-4 h-4 text-amber-400" />}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* HISTORY MODE */}
          {mode === "history" && (
            <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
              <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Injury History Timeline</div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Scrub the timeline to see trauma events and long-term scar tissue accumulation.</p>
              <div className="space-y-3">
                {(["left_knee","right_knee","lumbar","left_hip","left_shoulder"] as ZoneId[]).map(id => {
                  // Use real history if available, otherwise show current risk
                  const cur  = currentHistoryItem ? (liveRisk[id] ?? 0) : (liveRisk[id] ?? 0);
                  const prev = histCursor > 0 && historyData[histCursor-1] ? (liveRisk[id] ?? 0) : cur;
                  const base = historyData.length > 0 ? (liveRisk[id] ?? 0) : cur;
                  const delta = 0; // Delta requires per-session zone data — shown when full history sync is added
                  const totalDelta = 0;
                  return (
                    <div key={id} className="rounded-2xl bg-black/40 border border-white/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ background:riskColor(cur), color:riskColor(cur) }} />
                          <span className="text-sm font-bold">{ZONE_META[id]?.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg" style={{ color:riskColor(cur) }}>{cur}</span>
                          {delta !== 0 && (
                            <span className={`text-xs font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${delta>0 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                              {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(delta)}
                            </span>
                          )}
                        </div>
                      </div>
                      {totalDelta > 15 && (
                        <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg mt-2 flex items-start gap-2 border border-red-500/20">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Cumulative trauma detected. Scar tissue accumulating due to sustained load.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PROJECTION MODE */}
          {mode === "projection" && (
            <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
              <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                AI Risk Forecast
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {showTreatment
                  ? "Projected trajectory with the recommended physiotherapy intervention plan."
                  : "Projected decline with NO change to current habits or training load."}
              </p>
              <div className="space-y-3">
                {(["left_knee","lumbar","left_hip","right_knee","left_thigh"] as ZoneId[]).map(id => {
                  const proj   = activeProjections[projIdx];
                  const noTx   = proj?.zones[id] ?? (liveRisk[id] ?? 0);
                  const withTx = proj?.withTreatment[id] ?? Math.max(0, (liveRisk[id] ?? 0) - 10);
                  const cur    = liveRisk[id] ?? 0;
                  const shown  = showTreatment ? withTx : noTx;
                  return (
                    <div key={id} className="rounded-2xl bg-black/40 border border-white/5 p-4">
                      <div className="flex justify-between text-sm mb-3">
                        <span className="font-bold">{ZONE_META[id]?.label}</span>
                        <div className="flex gap-4 items-center">
                          <span className="text-muted-foreground text-xs font-medium">Today: <span className="font-mono font-bold" style={{color:riskColor(cur)}}>{cur}</span></span>
                          <span className="font-mono font-black text-lg" style={{color:riskColor(shown)}}>{shown}</span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="absolute h-full rounded-full opacity-20" style={{ width:`${noTx}%`, background:"#ef4444" }} />
                        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${shown}%`, background: showTreatment ? "#10b981" : riskColor(noTx) }} />
                      </div>
                      <div className={`text-xs mt-2.5 font-bold flex items-center gap-1.5 ${(shown-cur)>0 ? "text-red-400" : "text-emerald-400"}`}>
                        {(shown-cur) > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {shown-cur > 0 ? "+" : ""}{shown-cur} from today
                        {showTreatment && (
                          <span className="ml-auto text-muted-foreground font-medium">
                            saves {noTx-withTx} pts
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEADERBOARD MODE REMOVED */}

          {/* Footer navigation removed as requested */}
        </aside>
      </div>
    </div>
  );
}
