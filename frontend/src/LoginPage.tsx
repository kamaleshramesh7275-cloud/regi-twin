import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useLocation } from "wouter";
import { Activity, Brain, Smartphone, Shield, ArrowRight, ActivitySquare } from "lucide-react";

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError("");
    try {
      await loginWithGoogle();
      setLocation("/twin");
    } catch (error: any) {
      if (error?.message?.includes("dummy-api-key") || error?.code === "auth/invalid-api-key") {
        setAuthError("Firebase is not configured! Please provide real Firebase config keys in the code/env to test login.");
      } else if (error?.code !== "auth/popup-closed-by-user" && error?.code !== "auth/cancelled-popup-request") {
        setAuthError("Google Login failed: " + error.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || !email || !password) return;
    setIsLoggingIn(true);
    setAuthError("");
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      setLocation("/twin");
    } catch (error: any) {
      if (error?.message?.includes("dummy-api-key") || error?.code === "auth/invalid-api-key") {
        setAuthError("Firebase is not configured! Please provide real Firebase config keys in the code/env to test login.");
      } else {
        setAuthError(error.message || "Authentication failed.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#020813] text-white font-sans overflow-x-hidden flex flex-col">
      
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
        <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full" />
        <div className="absolute top-[60%] right-[10%] w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">PhysioTwin</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#clinical" className="hover:text-white transition-colors">Clinical Validation</a>
          </nav>
          <button onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold bg-white/10 hover:bg-white/20 transition-colors px-6 py-2.5 rounded-full">
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-6">
        
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col lg:flex-row items-center justify-between gap-16 py-12 lg:py-0">
          
          <div className="flex-1 space-y-8 text-center lg:text-left mt-12 lg:mt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold uppercase tracking-widest">
              <ActivitySquare className="w-4 h-4" /> Next-Gen Recovery
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1]">
              The Digital Twin of <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">Your Recovery.</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
              PhysioTwin integrates data from Google Fit, HealthifyMe, and Hevy to build a 3D biomechanical model of your body. Predict injuries, optimize tissue repair, and return to sport faster.
            </p>
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <button onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-primary hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Authentication Card */}
          <div id="auth-section" className="w-full max-w-md shrink-0">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-10 rounded-[2rem] shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">{isRegister ? "Create an Account" : "Welcome Back"}</h2>
                <p className="text-sm text-muted-foreground mt-2">Sync your wearable data to continue.</p>
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-6">
                  {authError}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4 mb-6">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary transition-colors placeholder:text-white/30"
                  required
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary transition-colors placeholder:text-white/30"
                  required
                />
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-primary text-white font-bold text-lg py-3.5 rounded-xl hover:bg-emerald-400 transition-all shadow-lg disabled:opacity-50 mt-2"
                >
                  {isLoggingIn ? "Authenticating..." : isRegister ? "Register Now" : "Sign In"}
                </button>
              </form>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                type="button"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold text-lg py-3.5 rounded-xl hover:bg-gray-200 transition-all shadow-xl disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="mt-8 text-center">
                <button 
                  type="button"
                  onClick={() => setIsRegister(!isRegister)} 
                  className="text-sm text-muted-foreground hover:text-white transition-colors underline underline-offset-4"
                >
                  {isRegister ? "Already have an account? Sign In" : "Need an account? Register"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4">Enterprise-Grade Clinical Intelligence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We don't just track workouts. We analyze the biomechanical impact of every step you take.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Universal Integration</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connects seamlessly with Google Fit, HealthifyMe, Hevy, Oura, and Apple Health. All your data in one master biomechanical brain.
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">3D Dynamic Risk Modeling</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Watch your digital twin update in real-time. If your training volume outpaces your recovery, we highlight the exact tendons at risk.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Diagnostic Reasoning</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Don't just see numbers. Get deep clinical explanations on why your Force Asymmetry matters and how your protein intake affects collagen synthesis.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 bg-black/80 backdrop-blur-md py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-bold">PhysioTwin</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 Pro Caffeinators. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
