import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { BrainCircuit, PenTool, CheckCircle, AlertTriangle, Wifi, WifiOff, X, HelpCircle, Loader } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { api } from "./api";
import { auth } from "./firebase";

interface ReadinessData {
  general_stress: number;
  emotional_stress: number;
  social_stress: number;
  fatigue: number;
  energy_deficit: number;
  physical_complaints: number;
  success: number;
  social_recovery: number;
  physical_recovery: number;
  well_being: number;
  kinesiophobia_score: number;
  sport_confidence_score: number;
  timestamp: string | null;
}

export default function MentalReadinessPage() {
  const [readiness, setReadiness] = useState<ReadinessData>({
    general_stress: 0, emotional_stress: 0, social_stress: 0,
    fatigue: 0, energy_deficit: 0, physical_complaints: 0,
    success: 0, social_recovery: 0, physical_recovery: 0, well_being: 0,
    kinesiophobia_score: 0, sport_confidence_score: 0, timestamp: null
  });
  
  const [loading, setLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Survey Form States
  const [form, setForm] = useState({
    general_stress: 3,
    emotional_stress: 2,
    social_stress: 2,
    fatigue: 4,
    energy_deficit: 3,
    physical_complaints: 3,
    success: 7,
    social_recovery: 8,
    physical_recovery: 6,
    well_being: 7,
    // TSK questions (Tampa Scale for Kinesiophobia) - 1 to 4 scale
    tsk_q1: 2, // "I am afraid that I might injure myself if I exercise"
    tsk_q2: 2, // "My pain tells me how severe my injury is"
    tsk_q3: 1, // "It's not really safe for me to be physically active"
    // ACL-RSI (Return to Sport Index) - 0 to 10 scale
    rsi_q1: 8, // "Are you confident that your joint will not give way?"
    rsi_q2: 7, // "Are you confident about performing at your previous sport level?"
  });

  const uid = auth.currentUser?.uid || "test-user";

  const loadReadiness = async () => {
    try {
      const data = await api.getReadinessSurvey(uid);
      setReadiness(data);
    } catch (e) {
      console.error("Failed to load readiness survey logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, [uid]);

  const handleSurveySubmit = async () => {
    setSubmitting(true);
    try {
      // Calculate composite Tampa Scale score (TSK) - baseline is 11, each question is 1-4.
      // We map our 3 questions to the full 11-44 scale: (tsk_q1 + tsk_q2 + tsk_q3) * 3 + 2
      const calculatedTSK = Math.min(44, Math.max(11, (form.tsk_q1 + form.tsk_q2 + form.tsk_q3) * 3 + 5));
      
      // Calculate Return to Sport Confidence (0-100%)
      const calculatedRSI = Math.round(((form.rsi_q1 + form.rsi_q2) / 20) * 100);

      const payload = {
        general_stress: form.general_stress * 10,
        emotional_stress: form.emotional_stress * 10,
        social_stress: form.social_stress * 10,
        fatigue: form.fatigue * 10,
        energy_deficit: form.energy_deficit * 10,
        physical_complaints: form.physical_complaints * 10,
        success: form.success * 10,
        social_recovery: form.social_recovery * 10,
        physical_recovery: form.physical_recovery * 10,
        well_being: form.well_being * 10,
        kinesiophobia_score: calculatedTSK,
        sport_confidence_score: calculatedRSI
      };

      await api.submitReadinessSurvey(uid, payload);
      await loadReadiness();
      setShowSurvey(false);
    } catch (e) {
      console.error("Failed to submit daily survey", e);
      alert("Failed to submit daily readiness survey.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasSurveyData = readiness.timestamp !== null;

  const RESTQ_DATA = [
    { subject: 'General Stress', A: readiness.general_stress, fullMark: 100 },
    { subject: 'Emotional Stress', A: readiness.emotional_stress, fullMark: 100 },
    { subject: 'Social Stress', A: readiness.social_stress, fullMark: 100 },
    { subject: 'Fatigue', A: readiness.fatigue, fullMark: 100 },
    { subject: 'Lack of Energy', A: readiness.energy_deficit, fullMark: 100 },
    { subject: 'Physical Complaints', A: readiness.physical_complaints, fullMark: 100 },
    { subject: 'Success', A: readiness.success, fullMark: 100 },
    { subject: 'Social Recovery', A: readiness.social_recovery, fullMark: 100 },
    { subject: 'Physical Recovery', A: readiness.physical_recovery, fullMark: 100 },
    { subject: 'General Well-being', A: readiness.well_being, fullMark: 100 },
  ];

  // Kinesiophobia Label Helper (TSK scale: 11 to 44. Low is <22, Moderate 22-33, High >33)
  const getTSKLabel = (score: number) => {
    if (score === 0) return "No Data";
    if (score < 24) return "Low";
    if (score < 34) return "Moderate";
    return "High";
  };

  const getTSKColor = (score: number) => {
    if (score === 0) return "text-muted-foreground";
    if (score < 24) return "text-emerald-400";
    if (score < 34) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" /> Mental Readiness
            </h1>
            <p className="text-muted-foreground text-sm mt-1 flex flex-wrap items-center gap-2">
              <span>Psychological readiness and stress-recovery balance (RESTQ-Sport).</span>
              {hasSurveyData ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                  <Wifi className="w-2.5 h-2.5" /> Survey Synced ({new Date(readiness.timestamp!).toLocaleDateString()})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                  <WifiOff className="w-2.5 h-2.5" /> No Survey Taken Today
                </span>
              )}
            </p>
          </div>
          <button 
            onClick={() => setShowSurvey(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <PenTool className="w-4 h-4" /> {hasSurveyData ? "Retake Daily Survey" : "Take Daily Survey"}
          </button>
        </header>

        {/* Survey Input Modal */}
        {showSurvey && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowSurvey(false)}>
            <div className="card w-full max-w-2xl space-y-4 my-8 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" /> Daily Stress-Recovery Survey
                </h3>
                <button onClick={() => setShowSurvey(false)}><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-6 py-2 pr-2 scrollbar-thin">
                {/* Section 1: Stress vs Recovery */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wider">RESTQ Stress-Recovery Profile</h4>
                  <p className="text-xs text-muted-foreground">Rate the following items from 0 (very low) to 10 (very high) for how you feel today.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Stress Items */}
                    <div className="space-y-3 bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                      <div className="font-bold text-xs text-red-400 mb-1">Stress Indices</div>
                      <div className="space-y-2">
                        <label className="block text-xs">General Stress level: <span className="font-bold text-red-400">{form.general_stress}</span></label>
                        <input type="range" min="0" max="10" value={form.general_stress} onChange={e => setForm(f => ({ ...f, general_stress: Number(e.target.value) }))} className="w-full accent-red-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs">Emotional Stress (worry/anxiety): <span className="font-bold text-red-400">{form.emotional_stress}</span></label>
                        <input type="range" min="0" max="10" value={form.emotional_stress} onChange={e => setForm(f => ({ ...f, emotional_stress: Number(e.target.value) }))} className="w-full accent-red-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs">Social/Relationship Stress: <span className="font-bold text-red-400">{form.social_stress}</span></label>
                        <input type="range" min="0" max="10" value={form.social_stress} onChange={e => setForm(f => ({ ...f, social_stress: Number(e.target.value) }))} className="w-full accent-red-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs">Physical Fatigue: <span className="font-bold text-red-400">{form.fatigue}</span></label>
                        <input type="range" min="0" max="10" value={form.fatigue} onChange={e => setForm(f => ({ ...f, fatigue: Number(e.target.value) }))} className="w-full accent-red-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs">Energy Deficit / Exhaustion: <span className="font-bold text-red-400">{form.energy_deficit}</span></label>
                        <input type="range" min="0" max="10" value={form.energy_deficit} onChange={e => setForm(f => ({ ...f, energy_deficit: Number(e.target.value) }))} className="w-full accent-red-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs">Physical Complaints/Soreness: <span className="font-bold text-red-400">{form.physical_complaints}</span></label>
                        <input type="range" min="0" max="10" value={form.physical_complaints} onChange={e => setForm(f => ({ ...f, physical_complaints: Number(e.target.value) }))} className="w-full accent-red-400" />
                      </div>
                    </div>

                    {/* Recovery Items */}
                    <div className="space-y-3 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                      <div className="font-bold text-xs text-emerald-400 mb-1">Recovery Indices</div>
                      <div className="space-y-2">
                        <label className="block text-xs">General Well-being: <span className="font-bold text-emerald-400">{form.well_being}</span></label>
                        <input type="range" min="0" max="10" value={form.well_being} onChange={e => setForm(f => ({ ...f, well_being: Number(e.target.value) }))} className="w-full accent-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs">Rehab/Training Success: <span className="font-bold text-emerald-400">{form.success}</span></label>
                        <input type="range" min="0" max="10" value={form.success} onChange={e => setForm(f => ({ ...f, success: Number(e.target.value) }))} className="w-full accent-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs">Social Recovery (support network): <span className="font-bold text-emerald-400">{form.social_recovery}</span></label>
                        <input type="range" min="0" max="10" value={form.social_recovery} onChange={e => setForm(f => ({ ...f, social_recovery: Number(e.target.value) }))} className="w-full accent-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs">Physical Recovery: <span className="font-bold text-emerald-400">{form.physical_recovery}</span></label>
                        <input type="range" min="0" max="10" value={form.physical_recovery} onChange={e => setForm(f => ({ ...f, physical_recovery: Number(e.target.value) }))} className="w-full accent-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Tampa Scale of Kinesiophobia */}
                <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Tampa Scale (Fear of Re-injury)</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs">"I am afraid that I might injure myself if I exercise."</label>
                      <div className="flex justify-between gap-2 pt-1 text-[10px]">
                        {[1, 2, 3, 4].map(v => (
                          <button key={v} onClick={() => setForm(f => ({ ...f, tsk_q1: v }))} className={`flex-1 py-1 rounded border transition-colors ${form.tsk_q1 === v ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary/50'}`}>
                            {v === 1 ? "Strongly Disagree" : v === 4 ? "Strongly Agree" : v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs">"My pain tells me how severe my injury is."</label>
                      <div className="flex justify-between gap-2 pt-1 text-[10px]">
                        {[1, 2, 3, 4].map(v => (
                          <button key={v} onClick={() => setForm(f => ({ ...f, tsk_q2: v }))} className={`flex-1 py-1 rounded border transition-colors ${form.tsk_q2 === v ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary/50'}`}>
                            {v === 1 ? "Strongly Disagree" : v === 4 ? "Strongly Agree" : v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs">"It is not really safe for me to be physically active right now."</label>
                      <div className="flex justify-between gap-2 pt-1 text-[10px]">
                        {[1, 2, 3, 4].map(v => (
                          <button key={v} onClick={() => setForm(f => ({ ...f, tsk_q3: v }))} className={`flex-1 py-1 rounded border transition-colors ${form.tsk_q3 === v ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary/50'}`}>
                            {v === 1 ? "Strongly Disagree" : v === 4 ? "Strongly Agree" : v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Return to Sport Confidence (ACL-RSI) */}
                <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Return to Sport Confidence (ACL-RSI)</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="block text-xs">Are you confident that your joint will not give way during sport? <span className="font-bold text-primary">({form.rsi_q1 * 10}%)</span></label>
                      <input type="range" min="0" max="10" value={form.rsi_q1} onChange={e => setForm(f => ({ ...f, rsi_q1: Number(e.target.value) }))} className="w-full accent-primary" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs">Are you confident about performing at your previous level of sport? <span className="font-bold text-primary">({form.rsi_q2 * 10}%)</span></label>
                      <input type="range" min="0" max="10" value={form.rsi_q2} onChange={e => setForm(f => ({ ...f, rsi_q2: Number(e.target.value) }))} className="w-full accent-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSurveySubmit}
                disabled={submitting}
                className="btn-primary w-full py-2.5"
              >
                {submitting ? "Submitting..." : "Submit Daily Survey"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <div className="lg:col-span-2 card space-y-4">
            <h3 className="font-bold text-lg">Stress-Recovery Profile</h3>
            <p className="text-sm text-muted-foreground mb-4">A visualization of your current psychological state. Optimal readiness requires high recovery scores (right side) and low stress scores (left side).</p>
            
            {loading ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <Loader className="w-5 h-5 animate-spin mr-2" /> Loading readiness data...
              </div>
            ) : !hasSurveyData ? (
              <div className="h-80 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-border rounded-xl bg-card/10">
                <BrainCircuit className="w-12 h-12 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground font-semibold">No survey data logged for today.</p>
                <button onClick={() => setShowSurvey(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs">
                  <PenTool className="w-3.5 h-3.5" /> Log Your First Entry
                </button>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RESTQ_DATA}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Current Profile" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card space-y-4">
              <h3 className="font-bold text-lg border-b border-border pb-3">Readiness Analysis</h3>
              
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">Fear of Re-injury (Kinesiophobia)</span>
                    <span className={`text-xs font-bold ${getTSKColor(readiness.kinesiophobia_score)}`}>
                      {getTSKLabel(readiness.kinesiophobia_score)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        readiness.kinesiophobia_score === 0 ? 'bg-muted' :
                        readiness.kinesiophobia_score < 24 ? 'bg-emerald-500' :
                        readiness.kinesiophobia_score < 34 ? 'bg-amber-500' : 'bg-red-500'
                      }`} 
                      style={{ width: readiness.kinesiophobia_score === 0 ? '0%' : `${Math.round((readiness.kinesiophobia_score / 44) * 100)}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {readiness.kinesiophobia_score === 0 
                      ? "Complete your daily survey to evaluate re-injury fear." 
                      : `TSK score: ${readiness.kinesiophobia_score}/44. Lower is better.`}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">Return to Sport Confidence</span>
                    <span className="text-xs font-bold text-primary">
                      {readiness.sport_confidence_score === 0 ? "No Data" : `${readiness.sport_confidence_score}%`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${readiness.sport_confidence_score}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {readiness.sport_confidence_score === 0 
                      ? "Complete daily survey to compute confidence index."
                      : "ACL-RSI score indicates psychological readiness for pivoting sports."}
                  </p>
                </div>
              </div>
            </div>

            {hasSurveyData && (
              <div className="card bg-amber-500/10 border-amber-500/20">
                <h3 className="font-bold text-amber-500 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Clinical Insight: Kinesiophobia
                </h3>
                {readiness.kinesiophobia_score < 24 ? (
                  <p className="text-sm text-amber-500/90 leading-relaxed">
                    Your Fear of Re-injury (Kinesiophobia) is <strong className="text-amber-500 font-bold">low ({readiness.kinesiophobia_score}/44)</strong>. This is an excellent prognostic indicator. Clinical data shows that patients with low kinesiophobia are neurologically ready for advanced plyometrics and fast cutting drills. Your confidence suggests optimal muscle activation patterns during landing.
                  </p>
                ) : (
                  <p className="text-sm text-amber-500/90 leading-relaxed">
                    Your Fear of Re-injury is <strong className="text-amber-500 font-bold">elevated ({readiness.kinesiophobia_score}/44)</strong>. Increased kinesiophobia can lead to conscious guard patterns, causing altered loading mechanics (like shifting weight to the opposite side). Prioritize quad/glute single-leg loading exercises in a controlled setting to rebuild sensory trust.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
