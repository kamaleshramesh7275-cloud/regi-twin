import { useState, useEffect } from 'react'
import { Link, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Onboarding from "./Onboarding";
import CaptureEngine from "./CaptureEngine";
import Dashboard from "./Dashboard";
import DemoDashboard from "./DemoDashboard";
import { NutritionRecovery } from "./NutritionRecovery";
import { WorkoutStrain } from "./WorkoutStrain";

import { Camera, Brain, Target, Shield, ArrowRight, Download, Sparkles, Smartphone, WifiOff } from "lucide-react";
import { AvatarProvider } from "./AvatarContext";
import { InstallAppModal } from "./components/InstallAppModal";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { usePWAInstall } from "./hooks/usePWAInstall";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});



function LandingPage() {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { isInstalled, isNativePromptAvailable, promptInstall } = usePWAInstall();

  const handleDownloadClick = async () => {
    // 1. Immediately trigger the APK file download
    try {
      const a = document.createElement('a');
      a.href = '/PhysioTwin.apk';
      a.download = 'PhysioTwin.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn("Direct APK download trigger:", e);
    }

    // 2. Also offer prompt / guidance modal
    if (isNativePromptAvailable) {
      try {
        const res = await promptInstall();
        if (res === "accepted") return;
      } catch (err) {
        console.warn("Install prompt error:", err);
      }
    }
    setShowInstallModal(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden bg-slate-950 text-slate-100">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top nav */}
      <nav className="relative w-full max-w-6xl flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 z-10 anim-fade">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-black text-white shadow-md">PT</div>
          <span className="font-bold text-base sm:text-lg text-white tracking-tight">PhysioTwin</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleDownloadClick}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="hidden xs:inline">{isInstalled ? "App Installed" : "Download App"}</span>
            <span className="xs:hidden">{isInstalled ? "Installed" : "Install"}</span>
          </button>
          <Link href="/login" className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors px-2 py-1">Log In</Link>
          <Link href="/register" className="btn btn-primary text-xs py-1.5 px-3.5 sm:py-2 sm:px-5 bg-blue-600 hover:bg-blue-500 border-none">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20 anim-up w-full">
        <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm max-w-full overflow-hidden">
          <span className="pulse-dot bg-blue-500 shrink-0" style={{width:'6px',height:'6px'}} />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest truncate">Elite Athlete Diagnostics · Public Access</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.15] mb-6 text-white">
          Elite Biomechanics. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Accessible to everyone.</span>
        </h1>

        <p className="text-sm sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
          The same high-precision 3D movement analysis, acute-to-chronic training strain calculations, and autonomic recovery monitoring used by Olympic committees and pro sports leagues — now running on your phone or laptop camera using computer vision and software APIs.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto w-full">
          <Link href="/register" className="btn btn-primary py-3.5 sm:py-4 px-6 sm:px-8 text-sm sm:text-base shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-500 border-none w-full sm:w-auto text-center justify-center">
            Initialize Your Twin <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <button
            onClick={handleDownloadClick}
            className="btn btn-secondary py-3.5 sm:py-4 px-5 sm:px-7 text-sm sm:text-base bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Download App
          </button>
          <Link href="/demo" className="btn btn-secondary py-3.5 sm:py-4 px-5 sm:px-7 text-sm sm:text-base bg-white/5 border-white/10 text-white hover:bg-white/10 w-full sm:w-auto text-center justify-center">
            View Demo
          </Link>
        </div>
      </div>

      {/* Science Democratized section */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 anim-up-d1">
        <div className="card bg-white/[0.02] border-white/5 backdrop-blur-md p-4 sm:p-8 rounded-2xl overflow-hidden">
          <h3 className="text-center text-xs sm:text-sm font-bold text-blue-400 uppercase tracking-wider mb-6">Democratizing Athlete Science</h3>
          <div className="overflow-x-auto scrollbar-hide -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3 px-3 sm:px-4 font-bold uppercase tracking-wider">Metric Stack</th>
                  <th className="py-3 px-3 sm:px-4 font-bold uppercase tracking-wider">Traditional Lab Rigs</th>
                  <th className="py-3 px-3 sm:px-4 font-bold uppercase tracking-wider text-blue-400">PhysioTwin democratization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-3.5 px-3 sm:px-4 font-bold">3D Kinematics</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">❌ $150,000 infra & motion rigs</td>
                  <td className="py-3.5 px-3 sm:px-4 font-bold text-blue-400">✅ Markerless computer vision on standard webcam</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 sm:px-4 font-bold">Autonomic Stress / Recovery</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">❌ Dedicated hardware sensors/belts</td>
                  <td className="py-3.5 px-3 sm:px-4 font-bold text-blue-400">✅ Consumer smartwatch sync (Garmin, Google Fit)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 sm:px-4 font-bold">Rotational joint strain</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">❌ Static periodic lab reports</td>
                  <td className="py-3.5 px-3 sm:px-4 font-bold text-blue-400">✅ Living 3D Digital Twin with real-time feedback</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 sm:px-4 font-bold">PWA Offline Access</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">❌ Tethered desktop software</td>
                  <td className="py-3.5 px-3 sm:px-4 font-bold text-blue-400">✅ 100% Offline-capable standalone install</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5 bg-slate-950/60 backdrop-blur-md anim-up-d2">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-white">Advanced Diagnostic Engines</h2>
          <p className="text-slate-400">Four sports science engines & offline mobile capability working together.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-white/[0.02] border-white/5 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-900/50 flex items-center justify-center mb-6">
              <Camera className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">Markerless 3D Mocap</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Estimate joint angles, symmetry, and movement velocity directly in your browser.
            </p>
          </div>
          
          <div className="card bg-white/[0.02] border-white/5 hover:border-indigo-500/30 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-900/50 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">Biomechanical AI Twin</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Interact with your living twin. Receive LLM insights derived from your real kinematic history.
            </p>
          </div>

          <div className="card bg-white/[0.02] border-white/5 hover:border-emerald-500/30 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-900/50 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">Training Strain Predictor</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Simulate cardiovascular stress and predict acute-to-chronic load fatigue thresholds.
            </p>
          </div>

          <div 
            onClick={() => setShowInstallModal(true)}
            className="card bg-gradient-to-b from-blue-950/40 to-slate-900/40 border border-blue-500/30 hover:border-blue-400/60 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all p-6 rounded-2xl cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-6">
              <Download className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">Download PWA</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Offline</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Install PhysioTwin directly onto your phone or desktop with full offline caching.
            </p>
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
              Install App <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-12 border-t border-white/5 bg-slate-950 relative z-10 mt-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-semibold text-slate-400">Privacy First & Offline Architecture</span>
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Motion diagnostics are processed client-side. No raw video feed is ever transmitted or stored on remote servers.
        </p>
      </footer>

      {/* Install PWA Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}

import CapturesPage from "./CapturesPage";
import { HistoryPage, TimelinePage, InsightsPage } from "./DummyPages";
import TwinPage from "./TwinPage";
import LeaderboardPage from "./LeaderboardPage";
import SettingsPage from "./SettingsPage";
import ProgramsPage from "./ProgramsPage";
import AnalyticsPage from "./AnalyticsPage";
import CommunityPage from "./CommunityPage";
import ClinicPage from "./ClinicPage";
import ClinicRosterPage from "./ClinicRosterPage";
import MedicationPage from "./MedicationPage";
import VitalsPage from "./VitalsPage";
import MentalReadinessPage from "./MentalReadinessPage";
import WikiPage from "./WikiPage";
import AchievementsPage from "./AchievementsPage";
import ExerciseLibrary from "./ExerciseLibrary";
import WorkoutLogger from "./WorkoutLogger";
import LoginPage from "./LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading || !user) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

  return <Component {...rest} />;
}

function AppContent() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === '/' && !loading && user) {
      setLocation("/dashboard");
    }
  }, [location, user, loading, setLocation]);

  return (
    <AvatarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={LoginPage} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/capture" component={CaptureEngine} />
        <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
        <Route path="/demo" component={DemoDashboard} />
        
        {/* Protected Routes */}
        <Route path="/twin"><ProtectedRoute component={TwinPage} /></Route>
        <Route path="/history"><ProtectedRoute component={CapturesPage} /></Route>
        <Route path="/projection"><ProtectedRoute component={TwinPage} /></Route>
        <Route path="/leaderboard"><ProtectedRoute component={LeaderboardPage} /></Route>
        <Route path="/nutrition-recovery"><ProtectedRoute component={NutritionRecovery} /></Route>
        <Route path="/muscular-strain"><ProtectedRoute component={WorkoutStrain} /></Route>
        <Route path="/exercises"><ProtectedRoute component={ExerciseLibrary} /></Route>
        <Route path="/workout-logger"><ProtectedRoute component={WorkoutLogger} /></Route>
        <Route path="/timeline"><ProtectedRoute component={TimelinePage} /></Route>
        <Route path="/insights"><ProtectedRoute component={InsightsPage} /></Route>
        <Route path="/settings"><ProtectedRoute component={SettingsPage} /></Route>
        <Route path="/programs"><ProtectedRoute component={ProgramsPage} /></Route>
        <Route path="/analytics"><ProtectedRoute component={AnalyticsPage} /></Route>
        <Route path="/community"><ProtectedRoute component={CommunityPage} /></Route>
        <Route path="/clinic/roster"><ProtectedRoute component={ClinicRosterPage} /></Route>
        <Route path="/clinic"><ProtectedRoute component={ClinicPage} /></Route>
        <Route path="/meds"><ProtectedRoute component={MedicationPage} /></Route>
        <Route path="/vitals"><ProtectedRoute component={VitalsPage} /></Route>
        <Route path="/readiness"><ProtectedRoute component={MentalReadinessPage} /></Route>
        <Route path="/wiki"><ProtectedRoute component={WikiPage} /></Route>
        <Route path="/achievements"><ProtectedRoute component={AchievementsPage} /></Route>

        <Route>
          <div className="min-h-screen flex items-center justify-center flex-col gap-4">
            <div className="text-6xl font-black text-gradient">404</div>
            <div className="text-muted-foreground">Page not found</div>
            <Link href="/" className="btn btn-primary mt-4">Go Home</Link>
          </div>
        </Route>
        </Switch>
        <OfflineIndicator />
      </div>
    </AvatarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
