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
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden bg-background">
      {/* Top nav */}
      <nav className="relative w-full max-w-6xl flex items-center justify-between px-6 py-6 z-10 anim-fade">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-black text-white shadow-md">PT</div>
          <span className="font-bold text-lg text-foreground tracking-tight">PhysioTwin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
          <Link href="/register" className="btn btn-primary text-xs py-2 px-5">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-16 pb-24 anim-up">
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full bg-white/60 border border-border backdrop-blur-sm shadow-sm">
          <span className="pulse-dot" style={{width:'6px',height:'6px', background: 'var(--color-primary)'}} />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Next-Gen Digital Twin</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] mb-6 text-foreground">
          Your body, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">digitized.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
          PhysioTwin builds a living digital model of your physical capability using computer vision and AI. Track stability, mobility, and predict recovery instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/register" className="btn btn-primary py-4 px-8 text-base shadow-lg shadow-blue-500/25">Initialize Your Twin <ArrowRight className="w-4 h-4 ml-1" /></Link>
          <Link href="/demo" className="btn btn-secondary py-4 px-8 text-base bg-white/50 backdrop-blur-sm">View Demo Dashboard</Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-border/50 bg-white/40 backdrop-blur-md anim-up-d2">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">How it works</h2>
          <p className="text-muted-foreground">Three powerful engines working together to digitize you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card bg-white/60 border-white/40 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Vision Capture</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Step back from your webcam. We use advanced pose-estimation to track your joints in 3D space during physical assessments. No wearables required.
            </p>
          </div>
          
          <div className="card bg-white/60 border-white/40 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Explainability</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Chat directly with your twin. Ask "Why is my stability dropping?" and get real-time answers based on your actual kinematic history.
            </p>
          </div>

          <div className="card bg-white/60 border-white/40 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">What-If Simulator</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Planning a hard workout? Simulate it first. See exactly how a 60-minute run will deplete your capability reserve and impact tomorrow's recovery.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-12 border-t border-border bg-slate-50 relative z-10 mt-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground">Privacy First Architecture</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Vision processing happens locally in your browser. No video is ever sent to our servers. Only biomechanical metadata is saved to your twin.
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
        <Route path="/history"><ProtectedRoute component={TwinPage} /></Route>
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
