import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Smartphone, Shield, Bell, Check, LogOut, User } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { api } from "./api";

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

  // Google Health integration state
  const [googleHealthConnected, setGoogleHealthConnected] = useState(false);
  const [isConnectingGoogleHealth, setIsConnectingGoogleHealth] = useState(false);
  const [googleHealthMsg, setGoogleHealthMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hevy integration state
  const [hevyConnected, setHevyConnected] = useState(false);
  const [hevyApiKey, setHevyApiKey] = useState("");
  const [isConnectingHevy, setIsConnectingHevy] = useState(false);
  const [hevyMsg, setHevyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check if redirected from Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("google_health_connected") === "true") {
      setGoogleHealthMsg({ type: "success", text: "Google Health (Fitbit) successfully connected via OAuth 2.0!" });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const checkStatus = async () => {
      try {
        const uid = user?.uid || "demo_user";
        const status = await api.getIntegrationStatus(uid);
        setGoogleHealthConnected(Boolean(status?.google_health));
        setHevyConnected(Boolean(status?.hevy));
      } catch (e) {
        console.error("Failed to fetch integration status:", e);
      }
    };
    checkStatus();
  }, [user]);

  const handleConnectGoogleHealth = async () => {
    try {
      setIsConnectingGoogleHealth(true);
      setGoogleHealthMsg(null);
      const uid = user?.uid || "demo_user";
      const res = await api.getGoogleHealthAuthorizeUrl(uid);
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setGoogleHealthMsg({ type: "error", text: err.message || "Failed to initiate Google Health connection." });
      setIsConnectingGoogleHealth(false);
    }
  };

  const handleDisconnectGoogleHealth = async () => {
    if (!confirm("Are you sure you want to disconnect Google Health?")) return;
    try {
      setIsConnectingGoogleHealth(true);
      setGoogleHealthMsg(null);
      const uid = user?.uid || "demo_user";
      await api.disconnectGoogleHealth(uid);
      setGoogleHealthConnected(false);
      setGoogleHealthMsg({ type: "success", text: "Google Health disconnected." });
    } catch (err: any) {
      setGoogleHealthMsg({ type: "error", text: err.message || "Failed to disconnect Google Health." });
    } finally {
      setIsConnectingGoogleHealth(false);
    }
  };

  const handleConnectHevy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hevyApiKey.trim()) return;
    try {
      setIsConnectingHevy(true);
      setHevyMsg(null);
      const uid = user?.uid || "demo_user";
      const res = await api.connectHevy(uid, hevyApiKey.trim());
      setHevyConnected(true);
      setHevyApiKey("");
      setHevyMsg({
        type: "success",
        text: res.warning ? `Connected! (${res.warning})` : "Hevy Pro connected and synced successfully!"
      });
    } catch (err: any) {
      setHevyMsg({ type: "error", text: err.message || "Failed to connect Hevy key." });
    } finally {
      setIsConnectingHevy(false);
    }
  };

  const handleDisconnectHevy = async () => {
    if (!confirm("Are you sure you want to disconnect Hevy?")) return;
    try {
      setIsConnectingHevy(true);
      setHevyMsg(null);
      const uid = user?.uid || "demo_user";
      await api.disconnectHevy(uid);
      setHevyConnected(false);
      setHevyMsg({ type: "success", text: "Hevy disconnected." });
    } catch (err: any) {
      setHevyMsg({ type: "error", text: err.message || "Failed to disconnect Hevy." });
    } finally {
      setIsConnectingHevy(false);
    }
  };

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

          {/* Connected Wearables & Apps */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-primary" /> Connected Wearables & Live Integrations
            </h2>
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-6">
              
              {/* Google Health (Fitbit) Live OAuth Integration */}
              <div className="p-4 rounded-xl bg-card border border-primary/30 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-primary/20 to-transparent text-[10px] font-bold text-primary uppercase tracking-wider rounded-bl-lg border-b border-l border-primary/20">
                  Recommended • Free Tier
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/25">
                      <span className="text-sm font-black text-blue-400">GH</span>
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        Google Health API (Fitbit)
                        {googleHealthConnected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Connected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/5 text-muted-foreground border border-white/10">
                            Not Connected
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Official, 100% free Google Cloud integration (replaces deprecated Fitbit Web API). Syncs workouts, active duration, and heart-rate intensity.
                      </div>
                    </div>
                  </div>
                  {googleHealthConnected ? (
                    <button
                      onClick={handleDisconnectGoogleHealth}
                      disabled={isConnectingGoogleHealth}
                      className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGoogleHealth}
                      disabled={isConnectingGoogleHealth}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                    >
                      {isConnectingGoogleHealth ? "Connecting..." : "Connect Google Health"}
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <span>
                      {googleHealthConnected 
                        ? "OAuth 2.0 refresh token is securely encrypted at rest (AES-Fernet). Ready for live ACWR & strain calculations."
                        : "Connect your regular Google / Fitbit account. No paid Hevy Pro or Strava developer subscription required."}
                    </span>
                  </div>
                  {googleHealthMsg && (
                    <div className={`text-xs p-2.5 rounded-lg mt-2 ${googleHealthMsg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {googleHealthMsg.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Hevy Pro Integration */}
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/25">
                      <span className="text-sm font-black text-primary">HV</span>
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        Hevy Pro Workout Tracker
                        {hevyConnected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Connected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/5 text-muted-foreground border border-white/10">
                            Not Connected
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Syncs barbell weightlifting sessions, sets, volume load, and calculates lift ACWR
                      </div>
                    </div>
                  </div>
                  {hevyConnected && (
                    <button
                      onClick={handleDisconnectHevy}
                      disabled={isConnectingHevy}
                      className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                {!hevyConnected ? (
                  <form onSubmit={handleConnectHevy} className="pt-2 border-t border-border/50 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Hevy requires a <strong className="text-foreground">Hevy Pro</strong> subscription to generate an API key. 
                      Generate your personal token at{" "}
                      <a 
                        href="https://hevy.com/settings?developer" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                      >
                        hevy.com/settings?developer ↗
                      </a>
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Paste your personal Hevy API key (e.g. hevy_api_...)"
                        value={hevyApiKey}
                        onChange={(e) => setHevyApiKey(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-primary font-mono"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isConnectingHevy || !hevyApiKey.trim()}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-primary/20 transition-all"
                      >
                        {isConnectingHevy ? "Connecting..." : "Connect Hevy"}
                      </button>
                    </div>
                    {hevyMsg && (
                      <div className={`text-xs p-2.5 rounded-lg ${hevyMsg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {hevyMsg.text}
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Key is encrypted at rest (AES-Fernet). Token never displayed for security.</span>
                    {hevyMsg && (
                      <span className={hevyMsg.type === 'error' ? 'text-red-400' : 'text-emerald-400'}>
                        {hevyMsg.text}
                      </span>
                    )}
                  </div>
                )}
              </div>


              <div className="w-full h-px bg-border/40" />

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
