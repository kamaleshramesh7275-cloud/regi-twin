import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  User, ShieldCheck, Activity, Dna, Trophy, Calendar, 
  HeartPulse, Award, Sparkles, ArrowLeft, Mail, Phone, Clock
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { Link, useLocation } from "wouter";
import { captureHistoryStore, type CaptureInsightRecord } from "./lib/captureHistoryStore";

export default function ProfilePage() {
  const { user } = useAuth();
  const [location] = useLocation();

  // Extract ?id= parameter if viewing another user
  const searchParams = new URLSearchParams(window.location.search);
  const targetId = searchParams.get("id");

  const isSelf = !targetId || targetId === user?.uid || targetId === user?.email?.split("@")[0];

  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<CaptureInsightRecord[]>([]);

  useEffect(() => {
    // Read local seed or default user state
    const uid = user?.uid || "guest";
    const cached = localStorage.getItem(`pt_user_seed_${uid}`) || localStorage.getItem('pt_current_user_profile');
    if (cached) {
      try {
        setProfile(JSON.parse(cached));
      } catch {
        setProfile(null);
      }
    }
    const userHistory = captureHistoryStore.getHistory(uid);
    setHistory(userHistory);
  }, [user, targetId]);

  const userName = isSelf ? (profile?.full_name || user?.displayName || user?.email?.split("@")[0] || "Athlete") : (targetId || "Peer Athlete");
  const userEmail = isSelf ? (user?.email || profile?.email || "athlete@physiotwin.ai") : `${targetId?.toLowerCase().replace(/\s+/g, '')}@physiotwin.ai`;
  const twinMode = profile?.twin_mode || "Athlete";
  const focusZone = profile?.primary_pain_zone || "Baseline Healthy";

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-24 md:pb-0 bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        
        {/* Back Link */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-2xl font-black text-slate-950 shadow-xl shadow-emerald-500/20 shrink-0">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {twinMode} Engine
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    Verified Profile
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white">{userName}</h1>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {userEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Captures</span>
                <span className="text-xl font-black text-emerald-400">{history.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Capability</span>
                <span className="text-xl font-black text-cyan-400">720</span>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Biometrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <Dna className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age &amp; Sex</span>
              <span className="text-sm font-bold text-white">{profile?.age || 28} Yrs · {profile?.biological_sex || "Male"}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Height &amp; Weight</span>
              <span className="text-sm font-bold text-white">{profile?.height_cm || 175} cm · {profile?.weight_kg || 72} kg</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <HeartPulse className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Joint Focus</span>
              <span className="text-sm font-bold text-white capitalize">{focusZone}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Injury Risk Index</span>
              <span className="text-sm font-bold text-emerald-400">0% (Optimal)</span>
            </div>
          </div>
        </div>

        {/* Capture Activity & Achievements Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Recent Vision Capture History */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Motion Capture Sessions
              </h2>
              <span className="text-xs text-slate-400">{history.length} Saved Scans</span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No live posture sessions logged yet.</p>
                <Link href="/capture" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors">
                  Start First Mocap Scan →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{rec.exerciseType}</span>
                      <span className="text-[11px] text-slate-400">{new Date(rec.timestamp).toLocaleDateString()} · {rec.durationSec}s</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block">{rec.bilateralSymmetryPercent}% Symmetry</span>
                      <span className="text-[10px] text-slate-500">Valgus {rec.peakValgusAngle}°</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Unlocked Trophy Badges */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Clinical Badges
              </h2>
              <Link href="/achievements" className="text-xs text-amber-400 font-bold hover:underline">
                View All Trophies →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Clinical Clearance</span>
                  <span className="text-[10px] text-emerald-300">0% Injury Risk</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3 opacity-60">
                <Trophy className="w-6 h-6 text-slate-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Kinematic Pioneer</span>
                  <span className="text-[10px] text-slate-500">1 / 10 Mocaps</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
