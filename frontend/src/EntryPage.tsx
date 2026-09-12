import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  UserCheck, 
  UserPlus, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Brain, 
  HeartPulse,
  CheckCircle2,
  Lock,
  Mail,
  Loader2,
  AlertTriangle,
  Download,
  Camera,
  Target,
  FileText,
  BookOpen,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { mapAuthError, validateEmail, validatePassword } from "./lib/authErrors";
import { InstallAppModal } from "./components/InstallAppModal";
import { usePWAInstall } from "./hooks/usePWAInstall";

export default function EntryPage() {
  const { loginWithEmail, loginWithAdminCode, role, user } = useAuth();
  const [, setLocation] = useLocation();

  // PWA & APK Download State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { isInstalled, isNativePromptAvailable, promptInstall } = usePWAInstall();

  // Admin inline login state
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("admin123");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState("");

  const handleDownloadClick = async () => {
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

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAdminAuthError("");
    try {
      const success = await loginWithAdminCode(adminCodeInput || "admin123");
      if (success) {
        setLocation('/admin');
      } else {
        setAdminAuthError("Invalid Admin Access Code. Enter 'admin123'");
      }
    } catch (err) {
      setAdminAuthError("Failed to authenticate as admin.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white scroll-smooth">
      {/* Ambient background lights */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed top-[40%] right-[30%] w-[30%] h-[30%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP NAVIGATION BAR (Unbounce Header Architecture) */}
      <header className="relative w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-6 z-30">
        
        {/* Left: Brand Logo & Version */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-xl text-white tracking-tight flex items-center gap-1.5">
              PhysioTwin <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">v2.0</span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Digital Biomechanical Intelligence</p>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
          <a href="#products" className="hover:text-emerald-400 transition-colors">Products</a>
          <a href="#about" className="hover:text-teal-400 transition-colors">About</a>
          <button 
            onClick={handleDownloadClick}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none text-xs font-bold text-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Download APK
          </button>
        </nav>

        {/* Right Action CTAs */}
        <div className="flex items-center gap-2.5">
          <Link 
            href="/login" 
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors px-3 py-2"
          >
            Log In
          </Link>

          <button
            onClick={handleDownloadClick}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isInstalled ? "App Installed" : "Download App"}</span>
          </button>

          <button 
            onClick={() => setShowAdminForm(!showAdminForm)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all shadow-sm hover:border-teal-500/40 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">{showAdminForm ? "Hide Admin Login" : "Clinician Admin Sign-In"}</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </div>
      </header>

      {/* 2-COLUMN SPLIT-HERO SECTION (Unbounce Split-Hero Pattern) */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 md:py-12 flex-1 flex flex-col justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center my-auto">
          
          {/* LEFT COLUMN: Enterprise Value Proposition & Headline (50% Width) */}
          <div className="flex flex-col items-start text-left space-y-6">
            
            {/* Category Breadcrumb Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-xs font-bold text-emerald-300 tracking-wide">📖 / Digital Biomechanical Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Your Personal 3D Biomechanical <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Digital Twin Engine.
              </span>
            </h1>

            {/* Byline / Science Committee Tagline */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 border-l-2 border-emerald-500 pl-3 py-0.5">
              <span>By PhysioTwin Science Committee</span>
              <span>·</span>
              <span className="text-emerald-400">Instant Vision Mocap</span>
              <span>·</span>
              <span className="text-teal-400">Offline Ready</span>
            </div>

            {/* Enterprise Description */}
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              Democratizing elite 3D movement analysis, acute-to-chronic training strain calculations, and autonomic recovery monitoring directly on your phone or laptop camera using computer vision and software APIs.
            </p>

            {/* Dual Hero Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto pt-2">
              <Link 
                href="/onboarding" 
                className="btn-primary py-3.5 px-7 text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 border-none rounded-xl text-white transition-all transform active:scale-98"
              >
                Initialize Twin Onboarding <ArrowRight className="w-4 h-4" />
              </Link>
              
              <button
                onClick={handleDownloadClick}
                className="py-3.5 px-6 text-sm font-bold flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Download App (APK)
              </button>
            </div>

            {/* Quick Proof Metrics */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/5 w-full text-slate-300">
              <div>
                <div className="text-lg font-black text-white font-mono-numbers">100%</div>
                <div className="text-[11px] text-slate-400">On-Device Vision</div>
              </div>
              <div>
                <div className="text-lg font-black text-emerald-400 font-mono-numbers">0.08s</div>
                <div className="text-[11px] text-slate-400">Pose Latency</div>
              </div>
              <div>
                <div className="text-lg font-black text-cyan-400 font-mono-numbers">4-Pillar</div>
                <div className="text-[11px] text-slate-400">Health History</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Gateway Showcase Box (50% Width) */}
          <div className="w-full">
            <div className="relative bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/10 space-y-6">
              
              {/* Card Ambient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">Platform Access Gateways</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Select Entry Route
                </span>
              </div>

              {/* 3 Entry Action Cards */}
              <div className="space-y-4">
                
                {/* Option 1: Existing User */}
                <Link
                  href="/login"
                  className="group relative bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-300 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Existing User Portal</h4>
                      <p className="text-[11px] text-slate-400">Sign in with email or Google account</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>

                {/* Option 2: New User Setup */}
                <Link
                  href="/onboarding"
                  className="group relative bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950/90 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-4 transition-all duration-300 flex items-center justify-between cursor-pointer ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
                >
                  <div className="absolute -top-2.5 right-4 bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                    Twin Boost Setup
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-110 transition-transform">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">New User Setup &amp; Baseline</h4>
                      <p className="text-[11px] text-slate-400">Build physical baseline &amp; launch twin</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>

                {/* Option 3: Admin Portal Direct Sign In */}
                <div 
                  className={`bg-slate-950/80 border rounded-2xl p-4 transition-all duration-300 ${
                    showAdminForm ? "border-teal-500 ring-1 ring-teal-500/30" : "border-slate-800 hover:border-teal-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Clinician &amp; Admin Portal</h4>
                        <p className="text-[11px] text-slate-400">Roster management &amp; clinical analytics</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAdminForm(!showAdminForm)}
                      className="text-xs font-semibold text-teal-400 hover:underline cursor-pointer"
                    >
                      {showAdminForm ? "Close Form" : "Enter Details"}
                    </button>
                  </div>

                  {showAdminForm && (
                    <form onSubmit={handleAdminSubmit} className="space-y-3 mt-4 pt-3 border-t border-slate-800">
                      {adminAuthError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] p-2 rounded-lg flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{adminAuthError}</span>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block mb-1">Admin Access Code</label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-teal-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Enter Code (e.g. admin123)"
                            value={adminCodeInput}
                            onChange={(e) => setAdminCodeInput(e.target.value)}
                            className="w-full bg-slate-900 border border-teal-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-teal-400"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isLoggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Unlock Admin Portal with Code 'admin123'"}
                      </button>
                    </form>
                  )}
                </div>

              </div>

              {/* Bottom APK Callout Bar */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PWA Offline Capable
                </span>
                <button onClick={handleDownloadClick} className="text-cyan-400 hover:underline cursor-pointer font-bold">
                  Get PhysioTwin APK →
                </button>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* PRODUCTS SECTION (#products) */}
      <section id="products" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5 bg-slate-950/60 backdrop-blur-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider mb-3">
            Diagnostic Engines
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Four Integrated Health Science Engines</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">Operating seamlessly in your browser with full offline support.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 hover:border-emerald-500/40 p-6 rounded-2xl transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Markerless 3D Mocap</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Estimate joint angles, symmetry, and movement velocity directly in your browser using camera computer vision.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 hover:border-teal-500/40 p-6 rounded-2xl transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Biomechanical AI Twin</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Interact with your living 3D avatar. Receive LLM insights derived from your real kinematic history.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 p-6 rounded-2xl transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Strain &amp; ACWR Predictor</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Track acute-to-chronic workload ratios per muscle group to prevent fatigue and re-injury.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 p-6 rounded-2xl transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Clinical OCR Parser</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Extract lab panels and historical injury records directly from PDF scans and medical documents.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION (#about) */}
      <section id="about" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md p-6 sm:p-10 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Privacy First &amp; On-Device</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computer vision motion diagnostics run 100% locally in your browser. No raw video feed is ever stored or transmitted.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">TSK-11 Fear Triage Engine</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integrated Tampa Scale for Kinesiophobia survey screens re-injury anxiety to align rehabilitation protocols.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Wearables &amp; Platform Sync</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sync resting HR, HRV, sleep, and activity levels via Garmin, Google Fit, Fitbit, and Apple Health APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 w-full text-center py-8 border-t border-slate-900 bg-slate-950 text-xs text-slate-500">
        <div className="flex items-center justify-center gap-4 mb-2 text-slate-400 font-semibold">
          <a href="#products" className="hover:text-white transition-colors">Products</a>
          <span>•</span>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <span>•</span>
          <button onClick={handleDownloadClick} className="hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none text-xs font-semibold text-slate-400">Download APK</button>
        </div>
        <p>© 2026 PhysioTwin System · Elite Biomechanical Democratization</p>
      </footer>

      {/* Install PWA & APK Guidance Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
