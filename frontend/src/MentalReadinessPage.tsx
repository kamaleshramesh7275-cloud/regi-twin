import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { BrainCircuit, PenTool, CheckCircle, AlertTriangle } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

const RESTQ_DATA = [
  { subject: 'General Stress', A: 30, fullMark: 100 },
  { subject: 'Emotional Stress', A: 20, fullMark: 100 },
  { subject: 'Social Stress', A: 25, fullMark: 100 },
  { subject: 'Fatigue', A: 45, fullMark: 100 },
  { subject: 'Lack of Energy', A: 40, fullMark: 100 },
  { subject: 'Physical Complaints', A: 50, fullMark: 100 },
  { subject: 'Success', A: 70, fullMark: 100 },
  { subject: 'Social Recovery', A: 85, fullMark: 100 },
  { subject: 'Physical Recovery', A: 75, fullMark: 100 },
  { subject: 'General Well-being', A: 80, fullMark: 100 },
];

export default function MentalReadinessPage() {
  const [surveyDone, setSurveyDone] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" /> Mental Readiness
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Psychological readiness and stress-recovery balance (RESTQ-Sport).</p>
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
