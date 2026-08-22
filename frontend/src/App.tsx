import { useState, useEffect } from 'react'
import { Link, Route, Switch, useLocation } from "wouter";

import Onboarding from "./Onboarding";
import CaptureEngine from "./CaptureEngine";
import Dashboard from "./Dashboard";
import DemoDashboard from "./DemoDashboard";
import { NutritionRecovery } from "./NutritionRecovery";
import { WorkoutStrain } from "./WorkoutStrain";

import { Camera, Brain, Target, Shield, ArrowRight } from "lucide-react";
import { AvatarProvider } from "./AvatarContext";

function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden bg-slate-950 text-slate-100">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top nav */}
      <nav className="relative w-full max-w-6xl flex items-center justify-between px-6 py-6 z-10 anim-fade">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-black text-white shadow-md">PT</div>
          <span className="font-bold text-lg text-white tracking-tight">PhysioTwin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Log In</Link>
          <Link href="/register" className="btn btn-primary text-xs py-2 px-5 bg-blue-600 hover:bg-blue-500 border-none">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-16 pb-20 anim-up">
        <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
          <span className="pulse-dot bg-blue-500" style={{width:'6px',height:'6px'}} />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Elite Athlete Diagnostics · Public Access</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] mb-6 text-white">
          Elite Biomechanics. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Accessible to everyone.</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
          The same high-precision 3D movement analysis, acute-to-chronic training strain calculations, and autonomic recovery monitoring used by Olympic committees and pro sports leagues — now running on your phone or laptop camera using computer vision and software APIs.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/register" className="btn btn-primary py-4 px-8 text-base shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-500 border-none">
            Initialize Your Twin <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link href="/demo" className="btn btn-secondary py-4 px-8 text-base bg-white/5 border-white/10 text-white hover:bg-white/10">
            View Demo Dashboard
          </Link>
        </div>
      </div>

      {/* Science Democratized section */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 anim-up-d1">
        <div className="card bg-white/[0.02] border-white/5 backdrop-blur-md p-8 rounded-2xl">
          <h3 className="text-center text-sm font-bold text-blue-400 uppercase tracking-wider mb-6">Democratizing Athlete Science</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Metric Stack</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Traditional Lab Rigs</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-400">PhysioTwin democratization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-4 px-4 font-bold">3D Kinematics</td>
                  <td className="py-4 px-4 text-slate-400">❌ $150,000 infra & motion rigs</td>
                  <td className="py-4 px-4 font-bold text-blue-400">✅ Markerless computer vision on standard webcam</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold">Autonomic Stress / Recovery</td>
                  <td className="py-4 px-4 text-slate-400">❌ Dedicated hardware sensors/belts</td>
                  <td className="py-4 px-4 font-bold text-blue-400">✅ Consumer smartwatch sync (Garmin, Google Fit)</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold">Rotational joint strain</td>
                  <td className="py-4 px-4 text-slate-400">❌ Static periodic lab reports</td>
                  <td className="py-4 px-4 font-bold text-blue-400">✅ Living 3D Digital Twin with real-time feedback</td>
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
          <p className="text-slate-400">Three premium sports science engines working together to align your posture and performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card bg-white/[0.02] border-white/5 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-900/50 flex items-center justify-center mb-6">
              <Camera className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Markerless 3D Motion Capture</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Step back from your webcam. We use advanced computer vision models to estimate joint angles, track symmetry, and calculate speed locally in your browser.
            </p>
          </div>
          
          <div className="card bg-white/[0.02] border-white/5 hover:border-indigo-500/30 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-900/50 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Biomechanical AI Twin</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Interact directly with your body's digital twin. Ask questions like "Why is my squat stability dropping?" and receive contextual feedback derived from your real kinematic history.
            </p>
          </div>

          <div className="card bg-white/[0.02] border-white/5 hover:border-emerald-500/30 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-900/50 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Acute-to-Chronic Load Predictor</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Simulate training stress before hitting the track. Predict exactly how cardiovascular volume or movement load will impact tomorrow's recovery and tissue thresholds.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-12 border-t border-white/5 bg-slate-950 relative z-10 mt-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-semibold text-slate-400">Privacy First Architecture</span>
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Motion diagnostics are processed client-side. No raw video feed is ever transmitted or stored on remote servers. Only calculated kinematic metrics persist.
        </p>
      </footer>
    </div>
  );
}

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
        <Route path="/history"><ProtectedRoute component={HistoryPage} /></Route>
        <Route path="/projection"><ProtectedRoute component={TwinPage} /></Route>
        <Route path="/leaderboard"><ProtectedRoute component={LeaderboardPage} /></Route>
        <Route path="/nutrition-recovery"><ProtectedRoute component={NutritionRecovery} /></Route>
        <Route path="/muscular-strain"><ProtectedRoute component={WorkoutStrain} /></Route>
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
      </div>
    </AvatarProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
