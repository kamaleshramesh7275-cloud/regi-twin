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

      {/* 2-COLUMN SPLIT-HERO SECTION */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-16 flex-1 flex flex-col justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center my-auto">
          
          {/* LEFT COLUMN: Value Proposition & Headline */}
          <div className="flex flex-col items-start text-left space-y-6">
            
            {/* Category Breadcrumb Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="pt-section-label text-slate-300">Biomechanical Health Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              Personal 3D Biomechanical <br />
              <span className="text-white">
                Digital Twin Engine
              </span>
            </h1>

            {/* Sub-headline / Byline */}
            <div className="text-xs font-semibold text-slate-400 border-l border-emerald-500/50 pl-3 py-0.5 tracking-wide">
              On-Device Vision Motion Capture &middot; Real-Time Kinematics &middot; Clinical Intelligence
            </div>

            {/* Enterprise Description */}
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              PhysioTwin fuses computer vision motion analysis, workload risk modeling, and physiological sensor data into a continuous 3D musculoskeletal digital twin — running entirely in your web browser.
            </p>

            {/* Dual Hero Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto pt-2">
              <Link 
                href="/onboarding" 
                className="py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all"
              >
                Initialize Twin Onboarding <ArrowRight className="w-4 h-4" />
              </Link>
              
              <button
                onClick={handleDownloadClick}
                className="py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-400" />
                Download App (APK)
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Gateway Showcase Box */}
          <div className="w-full">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="pt-section-label">Platform Entry Gateways</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Select Route
                </span>
              </div>

              {/* 3 Entry Action Cards */}
              <div className="space-y-3.5">
                
                {/* Option 1: Existing User */}
                <Link
                  href="/login"
                  className="group bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Existing User Portal</h4>
                      <p className="text-[11px] text-slate-400">Sign in to your digital twin dashboard</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* Option 2: New User Setup */}
                <Link
                  href="/onboarding"
                  className="group bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">New User Setup &amp; Baseline</h4>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Guided</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Configure physical parameters &amp; baseline</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* Option 3: Admin Portal Direct Sign In */}
                <div 
                  className={`bg-slate-950 border rounded-xl p-4 transition-all ${
                    showAdminForm ? "border-slate-700" : "border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Clinician &amp; Admin Portal</h4>
                        <p className="text-[11px] text-slate-400">Patient roster &amp; cohort analytics</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAdminForm(!showAdminForm)}
                      className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showAdminForm ? "Cancel" : "Sign In"}
                    </button>
                  </div>

                  {showAdminForm && (
                    <form onSubmit={handleAdminSubmit} className="space-y-3 mt-4 pt-3 border-t border-slate-800">
                      {adminAuthError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] p-2 rounded flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{adminAuthError}</span>
                        </div>
                      )}

                      <div>
                        <label className="pt-section-label block mb-1">Admin Access Code</label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Enter Code (admin123)"
                            value={adminCodeInput}
                            onChange={(e) => setAdminCodeInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-slate-700"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isLoggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Authenticate Admin Access"}
                      </button>
                    </form>
                  )}
                </div>

              </div>

              {/* Bottom Callout */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60">
                <span>On-device processing &middot; WebAssembly engine</span>
                <button onClick={handleDownloadClick} className="text-slate-400 hover:text-white cursor-pointer font-medium">
                  Get APK &rarr;
                </button>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* METRICS / PLATFORM SCALE STRIP */}
      <section className="w-full border-t border-b border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="pt-4 md:pt-0">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white">33</div>
            <div className="pt-section-label mt-1">Joint Landmarks</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white">&lt; 80ms</div>
            <div className="pt-section-label mt-1">Inference Latency</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white">20</div>
            <div className="pt-section-label mt-1">Anatomical Zones</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white">5</div>
            <div className="pt-section-label mt-1">Movement Modes</div>
          </div>
          <div className="pt-4 md:pt-0 col-span-2 md:col-span-1">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white">4</div>
            <div className="pt-section-label mt-1">Health Platform APIs</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 3-Step Flow */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 border-b border-slate-800">
        <div className="mb-12">
          <div className="pt-section-label mb-2">PLATFORM WORKFLOW</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How PhysioTwin Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors">
            <div className="font-mono text-xs font-bold text-emerald-400 mb-3">01 / CAPTURE</div>
            <h3 className="text-base font-bold text-white mb-2">Markerless Motion Capture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Position any smartphone or laptop camera. The browser-based MediaPipe runtime tracks 33 skeletal joint landmarks in real time with sub-80ms frame latency.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors">
            <div className="font-mono text-xs font-bold text-emerald-400 mb-3">02 / MODEL</div>
            <h3 className="text-base font-bold text-white mb-2">Construct 3D Digital Twin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kinematic vectors are synthesized with historical training loads, physiological recovery indicators, and kinesiophobia metrics to form your personal musculoskeletal state model.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors">
            <div className="font-mono text-xs font-bold text-emerald-400 mb-3">03 / ADVISE</div>
            <h3 className="text-base font-bold text-white mb-2">Clinical Intelligence &amp; ACWR</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              LLM diagnostic algorithms evaluate acute-to-chronic workload ratios, generating personalized corrective exercise prescriptions and re-injury risk advisories.
            </p>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION (#products) */}
      <section id="products" className="w-full max-w-7xl mx-auto px-6 py-20 border-b border-slate-800">
        <div className="mb-12">
          <div className="pt-section-label mb-2">DIAGNOSTIC MODULES</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Four Core Intelligence Engines</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="pt-section-label text-slate-400">KINEMATICS ENGINE</div>
            <h3 className="text-lg font-bold text-white">Markerless 3D Motion Capture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated skeletal landmark extraction for clinical posture, squat depth, sit-to-stand cadence, and bilateral symmetry assessments.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> Real-time joint angle calculation</li>
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> Valgus/varus deviation detection</li>
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> Bilateral symmetry ratio scoring</li>
            </ul>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="pt-section-label text-slate-400">BIOMECHANICAL MODEL</div>
            <h3 className="text-lg font-bold text-white">3D Digital Twin &amp; Holo View</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive anatomical visualization featuring 20 workload heatmaps, capability radar metrics, and longitudinal twin history.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> 20-zone muscle strain mapping</li>
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> 6-axis biomechanical radar</li>
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> LLM-powered twin query interface</li>
            </ul>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="pt-section-label text-slate-400">RISK ANALYTICS</div>
            <h3 className="text-lg font-bold text-white">Workload &amp; ACWR Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acute-to-chronic workload ratio calculator tracking muscle group fatigue accumulation to flag elevated re-injury windows.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> 7-day vs 28-day strain modeling</li>
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> What-If activity impact simulator</li>
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> Automated workload spike warnings</li>
            </ul>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="pt-section-label text-slate-400">MEDICAL RECORD OCR</div>
            <h3 className="text-lg font-bold text-white">Clinical Document Parser</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extract blood panel biomarkers, surgical histories, and imaging reports directly from uploaded PDFs and image scans.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> Automated lab panel structured extraction</li>
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> Historical injury timeline compilation</li>
              <li className="flex items-center gap-2"><span className="text-slate-600 font-mono">&mdash;</span> TSK-11 kinesiophobia score integration</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHO USES THIS */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 border-b border-slate-800">
        <div className="mb-12">
          <div className="pt-section-label mb-2">TARGET USERS</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Designed for Movement Professionals and Athletes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 divide-slate-800">
          <div className="space-y-2 pt-6 md:pt-0">
            <div className="pt-section-label text-emerald-400">FOR ATHLETES</div>
            <h3 className="text-base font-bold text-white">Objective Movement &amp; Recovery Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitor joint kinematics during home sessions, prevent overtraining via ACWR alerts, and share structured movement reports directly with your care team.
            </p>
          </div>

          <div className="space-y-2 pt-6 md:pt-0">
            <div className="pt-section-label text-emerald-400">FOR PHYSIOTHERAPISTS</div>
            <h3 className="text-base font-bold text-white">Remote Kinematic Monitoring &amp; Roster Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track multi-patient rehab compliance, review objective range-of-motion metrics between visits, and adjust exercise prescriptions using data baselines.
            </p>
          </div>

          <div className="space-y-2 pt-6">
            <div className="pt-section-label text-emerald-400">FOR CLINICS</div>
            <h3 className="text-base font-bold text-white">Standardized Biomechanical Intake</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Streamline initial consultations with automated clinical document OCR parsing, baseline movement assessments, and exportable longitudinal summaries.
            </p>
          </div>

          <div className="space-y-2 pt-6">
            <div className="pt-section-label text-emerald-400">FOR RESEARCHERS</div>
            <h3 className="text-base font-bold text-white">Structured Kinematic Data Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access standardized 33-landmark coordinate series, joint angle calculations, and workload ratios for clinical study protocols.
            </p>
          </div>
        </div>
      </section>

      {/* PLATFORM TRUST & ARCHITECTURE (#about) */}
      <section id="about" className="w-full max-w-7xl mx-auto px-6 py-20 border-b border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column — Privacy Architecture */}
          <div className="space-y-6">
            <div>
              <div className="pt-section-label mb-2">PRIVACY &amp; SECURITY</div>
              <h2 className="text-2xl font-extrabold text-white">Zero Video Transmission. On-Device Execution.</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              PhysioTwin processes video frames exclusively within the local browser WebAssembly execution space. No video streams or camera frames are uploaded to external servers.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">01</span>
                <p className="text-xs text-slate-300">Video frames parsed locally via MediaPipe WASM runtime</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">02</span>
                <p className="text-xs text-slate-300">Only anonymized joint coordinate arrays are passed to twin state</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">03</span>
                <p className="text-xs text-slate-300">Biometric data stored in encrypted local IndexedDB persistence</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">04</span>
                <p className="text-xs text-slate-300">Designed in accordance with healthcare data protection standards</p>
              </div>
            </div>
          </div>

          {/* Right Column — Integration Matrix */}
          <div className="space-y-6">
            <div>
              <div className="pt-section-label mb-2">SYSTEM ARCHITECTURE</div>
              <h2 className="text-2xl font-extrabold text-white">Supported Integrations &amp; Technologies</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated with major health platforms, machine learning runtimes, and physiological data standards.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-mono">Google Health Connect</div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-mono">Garmin Connect IQ</div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-mono">Fitbit Web API</div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-mono">Apple Health Kit</div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-mono">MediaPipe WASM</div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-mono">Groq LLaMA 3.1 API</div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-mono">Firebase Auth Engine</div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-mono">Capacitor Android Runtime</div>
            </div>
          </div>

        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 border-b border-slate-800">
        <div className="mb-12">
          <div className="pt-section-label mb-2">CLINICAL OBSERVATIONS</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Practitioner and Athlete Feedback</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="space-y-4 pt-6 md:pt-0">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "PhysioTwin identified a progressive hip-drop asymmetry in my gait that three months of clinical observation missed. The weekly trend letter was precise and actionable."
            </p>
            <div>
              <div className="text-xs font-bold text-white">Arjun R.</div>
              <div className="text-[11px] text-slate-500">Marathon Athlete</div>
            </div>
          </div>

          <div className="space-y-4 pt-6 md:pt-0 md:pl-8">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "We replaced three separate motion analysis subscriptions with this platform. The clinician roster view gives me objective movement baselines across 14 rehabilitation clients simultaneously."
            </p>
            <div>
              <div className="text-xs font-bold text-white">Dr. Meera S.</div>
              <div className="text-[11px] text-slate-500">Sports Physiotherapist</div>
            </div>
          </div>

          <div className="space-y-4 pt-6 md:pt-0 md:pl-8">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "The ACWR predictor accurately modeled my hamstring re-injury risk during return-to-play. I followed the workload recommendation and trained without incident."
            </p>
            <div>
              <div className="text-xs font-bold text-white">Ravi K.</div>
              <div className="text-[11px] text-slate-500">Footballer</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 border-b border-slate-800">
        <div className="mb-12">
          <div className="pt-section-label mb-2">FREQUENTLY ASKED QUESTIONS</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Technical &amp; Operational FAQ</h2>
        </div>

        <div className="space-y-4">
          <details className="pt-faq-details bg-slate-900/40 border border-slate-800 rounded-xl p-5 group">
            <summary className="flex items-center justify-between text-sm font-bold text-white cursor-pointer list-none">
              <span>Is video footage stored or transmitted to external servers?</span>
              <span className="pt-faq-icon text-emerald-400 font-mono text-lg font-bold">+</span>
            </summary>
            <p className="text-xs text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800">
              No. Video processing takes place completely on-device within your browser using WebAssembly. Raw camera frames are analyzed in real-time memory and immediately discarded. Only anonymized numerical joint coordinates are retained.
            </p>
          </details>

          <details className="pt-faq-details bg-slate-900/40 border border-slate-800 rounded-xl p-5 group">
            <summary className="flex items-center justify-between text-sm font-bold text-white cursor-pointer list-none">
              <span>Can PhysioTwin operate without an active internet connection?</span>
              <span className="pt-faq-icon text-emerald-400 font-mono text-lg font-bold">+</span>
            </summary>
            <p className="text-xs text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800">
              Yes. The platform is built as a Progressive Web App (PWA) with full service-worker caching. Motion capture, joint angle calculation, and local twin state updates work seamlessly offline.
            </p>
          </details>

          <details className="pt-faq-details bg-slate-900/40 border border-slate-800 rounded-xl p-5 group">
            <summary className="flex items-center justify-between text-sm font-bold text-white cursor-pointer list-none">
              <span>What cameras and hardware specifications are required?</span>
              <span className="pt-faq-icon text-emerald-400 font-mono text-lg font-bold">+</span>
            </summary>
            <p className="text-xs text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800">
              Any modern smartphone, tablet, or laptop equipped with a standard webcam (720p at 30fps minimum). No specialized depth sensors, infrared markers, or external hardware are required.
            </p>
          </details>

          <details className="pt-faq-details bg-slate-900/40 border border-slate-800 rounded-xl p-5 group">
            <summary className="flex items-center justify-between text-sm font-bold text-white cursor-pointer list-none">
              <span>How does pose accuracy compare to laboratory motion capture?</span>
              <span className="pt-faq-icon text-emerald-400 font-mono text-lg font-bold">+</span>
            </summary>
            <p className="text-xs text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800">
              MediaPipe 33-landmark estimation achieves clinical correlation for sagittal and frontal plane joint angles. While not replacing multi-camera optical lab systems, it provides highly consistent longitudinal baselines.
            </p>
          </details>

          <details className="pt-faq-details bg-slate-900/40 border border-slate-800 rounded-xl p-5 group">
            <summary className="flex items-center justify-between text-sm font-bold text-white cursor-pointer list-none">
              <span>Can clinicians monitor multiple patient twins simultaneously?</span>
              <span className="pt-faq-icon text-emerald-400 font-mono text-lg font-bold">+</span>
            </summary>
            <p className="text-xs text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800">
              Yes. Clinician administrator accounts feature a roster dashboard showing patient adherence, recent movement scores, ACWR risk status, and kinesiophobia questionnaire trends.
            </p>
          </details>

          <details className="pt-faq-details bg-slate-900/40 border border-slate-800 rounded-xl p-5 group">
            <summary className="flex items-center justify-between text-sm font-bold text-white cursor-pointer list-none">
              <span>What is Acute-to-Chronic Workload Ratio (ACWR)?</span>
              <span className="pt-faq-icon text-emerald-400 font-mono text-lg font-bold">+</span>
            </summary>
            <p className="text-xs text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800">
              ACWR compares acute training workload (7 days) against chronic training workload (28 days). Ratios between 0.8 and 1.3 represent the optimal training zone, while ratios above 1.5 indicate significantly elevated re-injury risk.
            </p>
          </details>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="w-full bg-slate-900 py-20 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="pt-section-label">GET STARTED</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Begin Your Biomechanical Baseline Assessment</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            No hardware installation. Access complete 3D motion capture and digital twin intelligence directly in your browser.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/onboarding" 
              className="w-full sm:w-auto py-3 px-8 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all"
            >
              Start Twin Onboarding
            </Link>
            <button
              onClick={handleDownloadClick}
              className="w-full sm:w-auto py-3 px-8 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all cursor-pointer"
            >
              Download Android APK
            </button>
          </div>
          <p className="text-[11px] text-slate-500 pt-2">
            On-device computer vision processing &middot; No video transmitted or saved
          </p>
        </div>
      </section>

      {/* REWRITTEN FOOTER */}
      <footer className="w-full bg-slate-950 py-12 border-t border-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-900">
          
          {/* Column 1 */}
          <div className="space-y-2">
            <div className="font-extrabold text-white text-sm">PhysioTwin v2.0</div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Digital twin platform for biomechanical health intelligence, markerless motion capture, and workload risk prediction.
            </p>
          </div>

          {/* Column 2 */}
          <div className="space-y-2">
            <div className="pt-section-label text-slate-300">PLATFORM</div>
            <div className="flex flex-col space-y-1.5 text-xs text-slate-400">
              <Link href="/onboarding" className="hover:text-white transition-colors">Onboarding Setup</Link>
              <Link href="/login" className="hover:text-white transition-colors">User Sign In</Link>
              <a href="#products" className="hover:text-white transition-colors">Diagnostic Modules</a>
              <a href="#about" className="hover:text-white transition-colors">Architecture &amp; Privacy</a>
              <button onClick={handleDownloadClick} className="hover:text-emerald-400 transition-colors text-left cursor-pointer bg-transparent border-none text-xs text-slate-400">Download Android APK</button>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-2">
            <div className="pt-section-label text-slate-300">CLINICAL NOTICE</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              PhysioTwin is intended for movement assessment and educational purposes. It does not replace formal clinical diagnosis by a licensed healthcare provider.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-slate-600 text-[11px] gap-2">
          <div>&copy; 2026 PhysioTwin System. All rights reserved.</div>
          <div>Powered by MediaPipe WebAssembly &amp; Groq LLaMA 3.1</div>
        </div>
      </footer>

      {/* Install PWA & APK Guidance Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}

