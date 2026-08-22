import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Smartphone, Shield, Bell, Check, LogOut, User } from "lucide-react";
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

  // Wearable platform toggles — persisted to localStorage
  const [appleHealth, toggleAppleHealth] = usePersistentToggle('setting_apple_health', true);
  const [garmin,      toggleGarmin]      = usePersistentToggle('setting_garmin', false);
  const [googleFit,   toggleGoogleFit]   = usePersistentToggle('setting_google_fit', true);
  const [fitbit,      toggleFitbit]      = usePersistentToggle('setting_fitbit', false);
  const [oura,        toggleOura]        = usePersistentToggle('setting_oura', false);

  // Notification toggles — persisted to localStorage
  const [weeklyReport, toggleWeeklyReport] = usePersistentToggle('setting_notif_weekly', true);
  const [injuryAlerts, toggleInjuryAlerts] = usePersistentToggle('setting_notif_injury', true);
  const [milestones,   toggleMilestones]   = usePersistentToggle('setting_notif_milestones', false);


  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-black">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 max-w-4xl mx-auto w-full pt-12 md:pt-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account, devices, and preferences.</p>
        </header>

        <div className="space-y-8">
          
          {/* Account & Profile */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" /> Account & Profile
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">{user?.email || "user@example.com"}</div>
                  <div className="text-sm text-muted-foreground">Pro Plan • Active</div>
                </div>
                <button onClick={logout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium px-4 py-2 bg-red-400/10 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </section>

          {/* Connected Devices */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-primary" /> Connected Wearables
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Google Fit</div>
                  <div className="text-sm text-muted-foreground">Syncs steps, heart rate, and activity</div>
                </div>
                <Toggle checked={googleFit} onChange={toggleGoogleFit} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Apple Health</div>
                  <div className="text-sm text-muted-foreground">Syncs steps, workouts, and heart rate</div>
                </div>
                <Toggle checked={appleHealth} onChange={toggleAppleHealth} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Garmin Connect</div>
                  <div className="text-sm text-muted-foreground">Syncs VO2 max and training load</div>
                </div>
                <Toggle checked={garmin} onChange={toggleGarmin} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Fitbit</div>
                  <div className="text-sm text-muted-foreground">Syncs sleep, HRV, and readiness</div>
                </div>
                <Toggle checked={fitbit} onChange={toggleFitbit} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Oura Ring</div>
                  <div className="text-sm text-muted-foreground">Syncs deep sleep and readiness scores</div>
                </div>
                <Toggle checked={oura} onChange={toggleOura} />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" /> Notifications
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Weekly Twin Report</div>
                  <div className="text-sm text-muted-foreground">Get an email summary of your physical changes</div>
                </div>
                <Toggle checked={weeklyReport} onChange={toggleWeeklyReport} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Injury Risk Alerts</div>
                  <div className="text-sm text-muted-foreground">Push notifications for cumulative trauma</div>
                </div>
                <Toggle checked={injuryAlerts} onChange={toggleInjuryAlerts} />
              </div>
              <div className="w-full h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Milestone Celebrations</div>
                  <div className="text-sm text-muted-foreground">Updates when you hit new benchmarking levels</div>
                </div>
                <Toggle checked={milestones} onChange={toggleMilestones} />
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" /> Privacy & Data
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-medium">Anonymous Benchmarking</div>
                  <div className="text-sm text-muted-foreground">Include your data in global capability analytics</div>
                </div>
                <div className="text-primary font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Enabled</div>
              </div>
              <button className="text-sm text-red-400 hover:text-red-300 font-medium">Request Data Deletion</button>
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
