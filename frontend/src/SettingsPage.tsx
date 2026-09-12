import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  Shield, 
  Bell, 
  Check, 
  LogOut, 
  User, 
  Dumbbell, 
  Apple, 
  Database,
  Edit3,
  Save,
  Activity,
  HeartPulse,
  Sparkles,
  Zap
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { useLocation } from "wouter";
import { api } from "./api";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-primary' : 'bg-secondary/40 border border-border/50'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function usePersistentToggle(key: string, defaultValue: boolean): [boolean, () => void] {
  const [value, setValue] = React.useState<boolean>(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === 'true' : defaultValue;
  });
  const toggle = () => setValue(prev => {
    const next = !prev;
    localStorage.setItem(key, String(next));
    return next;
  });
  return [value, toggle];
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  // Notification toggles — persisted to localStorage
  const [weeklyReport, toggleWeeklyReport] = usePersistentToggle('setting_notif_weekly', true);
  const [injuryAlerts, toggleInjuryAlerts] = usePersistentToggle('setting_notif_injury', true);
  const [milestones,   toggleMilestones]   = usePersistentToggle('setting_notif_milestones', false);

  // Preference toggles
  const [autoRestTimer, toggleAutoRestTimer] = usePersistentToggle('setting_auto_rest', true);
  const [hapticFeedback, toggleHapticFeedback] = usePersistentToggle('setting_haptics', true);

  // ── Profile State Management ──────────────────────────────────────────────────
  const uid = user?.uid || "dev-athlete";
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "Alex Mercer",
    email: user?.email || "alex.mercer@physiotwin.local",
    age: 28,
    height_cm: 175,
    weight_kg: 72,
    biological_sex: "Prefer not to say",
    activity_level: "Moderately Active",
    twin_mode: "General Human",
    primary_pain_zone: "None / Baseline Healthy",
    baseline_pain_level: 1,
    tsk_score: 22,
    goals: ["General Tracking", "Rehab & Recovery"],
  });

  // Load stored profile from cache or backend
  useEffect(() => {
    const loadProfile = async () => {
      const cached = localStorage.getItem(`pt_user_seed_${uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfile(prev => ({
            ...prev,
            ...parsed,
            full_name: parsed.full_name || prev.full_name,
            email: parsed.email || user?.email || prev.email,
            biological_sex: parsed.biological_sex || parsed.biologicalSex || prev.biological_sex,
            height_cm: parsed.height_cm || parsed.heightCm || prev.height_cm,
            weight_kg: parsed.weight_kg || parsed.weightKg || prev.weight_kg,
            activity_level: parsed.activity_level || parsed.activityLevel || prev.activity_level,
            twin_mode: parsed.twin_mode || parsed.twinMode || prev.twin_mode,
            primary_pain_zone: parsed.primary_pain_zone || parsed.primaryPainZone || prev.primary_pain_zone,
            baseline_pain_level: parsed.baseline_pain_level ?? parsed.baselinePainLevel ?? prev.baseline_pain_level,
            tsk_score: parsed.tsk_score ?? prev.tsk_score,
            goals: parsed.goals || prev.goals,
          }));
        } catch (e) {
          console.warn("Failed to parse cached profile", e);
        }
      } else {
        const fetched = await api.getUserProfile(uid);
        if (fetched) {
          setProfile(prev => ({ ...prev, ...fetched }));
        }
      }
    };
    loadProfile();
  }, [uid, user?.email]);

  const handleProfileChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updatedProfile = {
        ...profile,
        uid,
        updatedAt: new Date().toISOString()
      };
      
      // Save locally
      localStorage.setItem(`pt_user_seed_${uid}`, JSON.stringify(updatedProfile));

      // Save to FastAPI backend API
      await api.saveUserProfile(uid, updatedProfile);

      // Save to Firestore
      if (user && db) {
        try {
          await setDoc(doc(db, "users", uid), updatedProfile, { merge: true });
        } catch (err) {
          console.warn("Firestore profile save warning:", err);
        }
      }

      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate BMI for display
  const bmi = profile.height_cm > 0 
    ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
    : "23.5";

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-24 md:pb-0 bg-black">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-8 max-w-4xl mx-auto w-full pt-6 md:pt-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Athlete Profile & Settings</h1>
            <p className="text-muted-foreground mt-1">View and manage your baseline biomechanical details and digital twin config.</p>
          </div>
          {saveSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in">
              <Check className="w-4 h-4" /> Profile Saved!
            </div>
          )}
        </header>

        <div className="space-y-8">
          
          {/* Account & Profile Card */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-primary" /> Comprehensive Athlete Profile
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all cursor-pointer"
              >
                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? "Cancel Edit" : "Edit Baseline Details"}</span>
              </button>
            </div>

            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-6">
              
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
                    {profile.full_name ? profile.full_name.substring(0, 2).toUpperCase() : "PT"}
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) => handleProfileChange("full_name", e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-sm text-white font-bold"
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleProfileChange("email", e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-400 block"
                          placeholder="Email"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="font-extrabold text-xl text-white">{profile.full_name}</h3>
                        <p className="text-xs text-slate-400">{profile.email}</p>
                      </>
                    )}
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-1">
                      <Check className="w-3.5 h-3.5" /> Digital Twin Seed Active • Native Plan
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Twin Mode: {profile.twin_mode}
                  </span>
                </div>
              </div>

              {/* Physical Baseline Parameters Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" /> Physical Baseline Parameters
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-card/80 border border-border/80 p-3.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Age</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={profile.age}
                        onChange={(e) => handleProfileChange("age", Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm font-bold text-white mt-1"
                      />
                    ) : (
                      <span className="text-base font-extrabold text-white">{profile.age} yrs</span>
                    )}
                  </div>

                  <div className="bg-card/80 border border-border/80 p-3.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Height</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={profile.height_cm}
                        onChange={(e) => handleProfileChange("height_cm", Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm font-bold text-white mt-1"
                      />
                    ) : (
                      <span className="text-base font-extrabold text-white">{profile.height_cm} cm</span>
                    )}
                  </div>

                  <div className="bg-card/80 border border-border/80 p-3.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Weight</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={profile.weight_kg}
                        onChange={(e) => handleProfileChange("weight_kg", Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm font-bold text-white mt-1"
                      />
                    ) : (
                      <span className="text-base font-extrabold text-white">{profile.weight_kg} kg</span>
                    )}
                  </div>

                  <div className="bg-card/80 border border-border/80 p-3.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Calculated BMI</span>
                    <span className="text-base font-extrabold text-emerald-400">{bmi}</span>
                  </div>
                </div>
              </div>

              {/* Medical Screen & Twin Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-card/80 border border-border/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-400" /> Primary Pain Zone
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Pain: {profile.baseline_pain_level}/10
                    </span>
                  </div>
                  {isEditing ? (
                    <select
                      value={profile.primary_pain_zone}
                      onChange={(e) => handleProfileChange("primary_pain_zone", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white mt-1"
                    >
                      <option>None / Baseline Healthy</option>
                      <option>Knee (ACL / Patellar)</option>
                      <option>Lower Back (Lumbar)</option>
                      <option>Shoulder (Rotator Cuff)</option>
                      <option>Ankle & Achilles</option>
                      <option>Hip & Pelvis</option>
                    </select>
                  ) : (
                    <p className="text-sm font-semibold text-white">{profile.primary_pain_zone}</p>
                  )}
                </div>

                <div className="bg-card/80 border border-border/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> TSK-11 Kinesiophobia Score
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                      {profile.tsk_score}/44 Score
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fear of Movement Triage: <strong className="text-white">Low/Moderate Fear-Avoidance</strong> (Safe for training load).
                  </p>
                </div>
              </div>

              {/* Goals Badges */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Target Objectives</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.goals.map((g: string) => (
                    <span key={g} className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200">
                      🎯 {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Edit Save Button */}
              {isEditing && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 text-xs"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving Baseline..." : "Save Profile Details"}
                  </button>
                </div>
              )}

            </div>
          </section>

          {/* Native Storage & Architecture */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
              <Database className="w-5 h-5 text-primary" /> Native In-App Engines (Zero External Dependencies)
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-4">
              <div className="p-4 rounded-xl bg-card border border-border/80 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Native Exercise Catalog & Logger</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      108 categorized movements with vector SVG cards, automated Epley 1RM PR detection, and ACWR fatigue models.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Native Ready
                </span>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border/80 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Apple className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Native Food Database & Macro Tracker</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Accurate whole food catalog, instant portion scaling, photo upload archiving, water hydration, and weight trends.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Native Ready
                </span>
              </div>
            </div>
          </section>

          {/* Workout Logging Preferences */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
              <Dumbbell className="w-5 h-5 text-primary" /> Training Preferences
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Auto Rest Timer on Set Completion</div>
                  <div className="text-sm text-muted-foreground">Automatically trigger countdown when a set is checked off</div>
                </div>
                <Toggle checked={autoRestTimer} onChange={toggleAutoRestTimer} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">PR Celebration Vibrations / Audio</div>
                  <div className="text-sm text-muted-foreground">High-energy celebration banners on 1RM breakthroughs</div>
                </div>
                <Toggle checked={hapticFeedback} onChange={toggleHapticFeedback} />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
              <Bell className="w-5 h-5 text-primary" /> Notifications & Alerts
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Weekly Twin Report</div>
                  <div className="text-sm text-muted-foreground">Summary of your acute workload & recovery balance</div>
                </div>
                <Toggle checked={weeklyReport} onChange={toggleWeeklyReport} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">ACWR Overreach Warnings</div>
                  <div className="text-sm text-muted-foreground">Alerts when Acute:Chronic ratio spikes above 1.5</div>
                </div>
                <Toggle checked={injuryAlerts} onChange={toggleInjuryAlerts} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Milestone & PR Notifications</div>
                  <div className="text-sm text-muted-foreground">Updates when you hit new capability benchmarks</div>
                </div>
                <Toggle checked={milestones} onChange={toggleMilestones} />
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
              <Shield className="w-5 h-5 text-primary" /> Privacy & Local Security
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-medium text-white">Local Media Archiving</div>
                  <div className="text-sm text-muted-foreground">Workout and meal photos are stored securely on local device/backend</div>
                </div>
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1"><Check className="w-4 h-4" /> Active</div>
              </div>
              <button className="text-sm text-red-400 hover:text-red-300 font-medium">Request Local Data Purge</button>
            </div>
          </section>

        </div>

        {/* Log Out Action */}
        <div className="mt-12 flex justify-center pb-8">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-base md:text-lg text-white font-bold px-8 py-3.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] cursor-pointer"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </main>
    </div>
  );
}
