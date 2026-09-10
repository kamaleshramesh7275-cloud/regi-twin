import React from "react";
import { Sidebar } from "./components/Sidebar";
import { Smartphone, Shield, Bell, Check, LogOut, User, Dumbbell, Apple, Database } from "lucide-react";
import { useAuth } from "./context/AuthContext";

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

  // Notification toggles — persisted to localStorage
  const [weeklyReport, toggleWeeklyReport] = usePersistentToggle('setting_notif_weekly', true);
  const [injuryAlerts, toggleInjuryAlerts] = usePersistentToggle('setting_notif_injury', true);
  const [milestones,   toggleMilestones]   = usePersistentToggle('setting_notif_milestones', false);

  // Preference toggles
  const [autoRestTimer, toggleAutoRestTimer] = usePersistentToggle('setting_auto_rest', true);
  const [hapticFeedback, toggleHapticFeedback] = usePersistentToggle('setting_haptics', true);

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-black">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 max-w-4xl mx-auto w-full pt-12 md:pt-10">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white">Settings & Preferences</h1>
          <p className="text-muted-foreground mt-1">Manage your native profile, local storage engines, and notifications.</p>
        </header>

        <div className="space-y-8">
          
          {/* Account & Profile */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
              <User className="w-5 h-5 text-primary" /> Athlete Profile & Subscription
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-white">{user?.email || "athlete@physiotwin.local"}</div>
                  <div className="text-sm text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <Check className="w-4 h-4" /> Native Tracking Plan • Unlimited Access
                  </div>
                </div>
                <button onClick={logout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-bold px-4 py-2 bg-red-400/10 rounded-xl transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
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
        <div className="mt-12 flex justify-center pb-12">
          <button 
            onClick={logout} 
            className="flex items-center gap-2 text-lg text-white font-bold px-8 py-4 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </main>
    </div>
  );
}
