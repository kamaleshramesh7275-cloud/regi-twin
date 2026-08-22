import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { BrainCircuit, PenTool, CheckCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

export default function MentalReadinessPage() {
  const { user } = useAuth();
  const [surveyDone, setSurveyDone] = useState(false);
  const [vitals, setVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const uid = user?.uid || "test-user";
        const data = await api.getLatestWearable(uid);
        setVitals(data);
      } catch (err) {
        console.error("Failed to fetch wearable readiness data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVitals();
  }, [user]);

  // Derived scores from synced wearable stats, falling back to typical values if not synced
  const hrv = vitals?.hrv ?? 62;
  const sleep = vitals?.sleep_score ?? 88;
  const readiness = vitals?.readiness_score ?? 78;

  const RESTQ_DATA = [
    { subject: 'General Stress', A: Math.max(10, Math.round(100 - readiness)), fullMark: 100 },
    { subject: 'Emotional Stress', A: Math.max(10, Math.round(95 - readiness * 0.9)), fullMark: 100 },
    { subject: 'Social Stress', A: 25, fullMark: 100 },
    { subject: 'Fatigue', A: Math.max(10, Math.round(100 - sleep)), fullMark: 100 },
    { subject: 'Lack of Energy', A: Math.max(10, Math.round(90 - sleep * 0.8)), fullMark: 100 },
    { subject: 'Physical Complaints', A: Math.max(10, Math.round(110 - hrv * 1.5)), fullMark: 100 },
    { subject: 'Success', A: Math.min(100, Math.round(readiness * 0.9)), fullMark: 100 },
    { subject: 'Social Recovery', A: 85, fullMark: 100 },
    { subject: 'Physical Recovery', A: Math.min(100, Math.round(hrv * 1.2)), fullMark: 100 },
    { subject: 'General Well-being', A: Math.min(100, sleep), fullMark: 100 },
  ];


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
              {vitals?.source && vitals.source !== "not_synced" ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                  <Wifi className="w-2.5 h-2.5" /> Live Synced ({vitals.source.replace('_', ' ')})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                  <WifiOff className="w-2.5 h-2.5" /> Wearable Not Connected (Using Defaults)
                </span>
              )}
            </p>
          </div>
          <button 
            onClick={() => setSurveyDone(true)}
            className={`flex items-center gap-2 px-4 py-2 ${surveyDone ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
            disabled={surveyDone}
          >
            {surveyDone ? <><CheckCircle className="w-4 h-4" /> Survey Complete</> : <><PenTool className="w-4 h-4" /> Take Daily Survey</>}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Radar Chart */}
          <div className="lg:col-span-2 card space-y-4">
            <h3 className="font-bold text-lg">Stress-Recovery Profile</h3>
            <p className="text-sm text-muted-foreground mb-4">A visualization of your current psychological state. Optimal readiness requires high recovery scores (right side) and low stress scores (left side).</p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RESTQ_DATA}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Current Profile" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card space-y-4">
              <h3 className="font-bold text-lg border-b border-border pb-3">Readiness Analysis</h3>
              
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">Fear of Re-injury (Kinesiophobia)</span>
                    <span className="text-xs font-bold text-emerald-500">Low</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '20%' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">TSK-11 score indicates high confidence in the surgical joint.</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">Return to Sport Confidence</span>
                    <span className="text-xs font-bold text-primary">High (85%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '85%' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">ACL-RSI score indicates psychological readiness for pivoting sports.</p>
                </div>
              </div>
            </div>

            <div className="card bg-amber-500/10 border-amber-500/20">
              <h3 className="font-bold text-amber-500 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Clinical Insight: Kinesiophobia
              </h3>
              <p className="text-sm text-amber-500/90 leading-relaxed">
                Your physical complaints score is slightly elevated (50/100), but your <strong className="text-amber-500 font-bold">Fear of Re-injury (Kinesiophobia) is low</strong>. This is an excellent prognostic indicator. Clinical data shows that patients with high kinesiophobia at month 4 have a 3x higher risk of contralateral (opposite leg) injury due to subconscious weight-shifting during sports. Your confidence profile suggests you are neurologically ready for advanced plyometrics.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
