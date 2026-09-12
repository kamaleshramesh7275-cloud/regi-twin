import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Link, useLocation } from "wouter";
import {
  Activity,
  Brain,
  Smartphone,
  Shield,
  ArrowRight,
  ActivitySquare,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
} from "lucide-react";
import {
  mapAuthError,
  isIgnorableAuthError,
  validateEmail,
  validatePassword,
  passwordStrength,
} from "./lib/authErrors";

// ── Password strength indicator ───────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const strength = passwordStrength(password);
  const colors = ["bg-red-500", "bg-amber-400", "bg-emerald-400"];
  const labels = ["Too short", "Weak", "Moderate", "Strong"];
  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? colors[strength - 1] : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-semibold ${
        strength === 0 ? "text-red-400" :
        strength === 1 ? "text-amber-400" :
        strength === 2 ? "text-amber-300" : "text-emerald-400"
      }`}>
        {labels[strength]}
      </span>
    </div>
  );
}

// ── Reset password modal ───────────────────────────────────────────────────────
function ResetPasswordModal({
  onClose,
  resetPassword,
}: {
  onClose: () => void;
  resetPassword: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(mapAuthError(err) || "Could not send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
        {sent ? (
          <div className="text-center">
            <MailCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Check your inbox</h3>
            <p className="text-sm text-white/60 mb-6">
              We sent a password reset link to <strong>{email}</strong>. It may take a minute to arrive.
            </p>
            <button onClick={onClose} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-1">Reset your password</h3>
            <p className="text-sm text-white/60 mb-6">
              Enter the email address you used to sign up. We'll send you a reset link.
            </p>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors placeholder:text-white/30"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>
              <button type="button" onClick={onClose} className="text-sm text-white/50 hover:text-white transition-colors py-1">
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Login Page ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, role } = useAuth();
  const [, setLocation] = useLocation();

  // Role-aware post-login destination
  const getPostLoginDest = () => {
    if (role === 'superadmin') return '/admin';
    if (role === 'clinician') return '/clinician';
    return '/dashboard';
  };
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showReset, setShowReset] = useState(false);

  // Real-time field validation state
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailError = emailTouched ? validateEmail(email) : "";
  const passwordError = passwordTouched ? validatePassword(password, isRegister) : "";

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError("");
    try {
      await loginWithGoogle();
      setLocation(getPostLoginDest());
    } catch (error) {
      if (!isIgnorableAuthError(error)) {
        setAuthError(mapAuthError(error));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Force-touch both fields to show all errors
    setEmailTouched(true);
    setPasswordTouched(true);

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password, isRegister);
    if (emailErr || passErr) return; // Don't hit Firebase with invalid input

    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError("");
    try {
      if (isRegister) {
        await registerWithEmail(email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }
      setLocation(getPostLoginDest());
    } catch (error: any) {
      const code = error?.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setAuthError("Account not found. Please register as a new user first.");
      } else {
        setAuthError(mapAuthError(error));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setAuthError("");
    setEmailTouched(false);
    setPasswordTouched(false);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#020813] text-white font-sans overflow-x-hidden flex flex-col">
      
      {/* Reset Password Modal */}
      {showReset && (
        <ResetPasswordModal
          onClose={() => setShowReset(false)}
          resetPassword={resetPassword}
        />
      )}

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
          <button
            onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm font-bold bg-white/10 hover:bg-white/20 transition-colors px-6 py-2.5 rounded-full"
          >
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
              <button
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-primary hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Authentication Card */}
          <div id="auth-section" className="w-full max-w-md shrink-0">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-10 rounded-[2rem] shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">{isRegister ? "Create an Account" : "Welcome Back"}</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {isRegister ? "Join thousands of athletes rebuilding smarter." : "Sync your wearable data to continue."}
                </p>
              </div>

              {/* Global auth error */}
              {authError && (
                <div
                  role="alert"
                  id="auth-error-message"
                  className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-6 flex items-start gap-2"
                >
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4 mb-6" noValidate>
                {/* Email field */}
                <div>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 outline-none focus:border-primary transition-colors placeholder:text-white/30 ${
                      emailError ? "border-red-500/60" : "border-white/10"
                    }`}
                    autoComplete="email"
                    aria-describedby={emailError ? "email-error" : undefined}
                  />
                  {emailError && (
                    <p id="email-error" className="text-red-400 text-xs mt-1.5 ml-1">{emailError}</p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 pr-12 outline-none focus:border-primary transition-colors placeholder:text-white/30 ${
                        passwordError ? "border-red-500/60" : "border-white/10"
                      }`}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      aria-describedby={passwordError ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p id="password-error" className="text-red-400 text-xs mt-1.5 ml-1">{passwordError}</p>
                  )}
                  {isRegister && <StrengthBar password={password} />}
                </div>

                {/* Forgot password (sign-in only) */}
                {!isRegister && (
                  <div className="text-right -mt-1">
                    <button
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="text-xs text-white/50 hover:text-primary transition-colors underline underline-offset-2"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  id="auth-submit-button"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-primary text-white font-bold text-lg py-3.5 rounded-xl hover:bg-emerald-400 transition-all shadow-lg disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
                >
                  {isLoggingIn && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isLoggingIn
                    ? "Authenticating..."
                    : isRegister
                    ? "Create Account"
                    : "Sign In"}
                </button>
              </form>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <button
                id="google-login-button"
                onClick={handleGoogleLogin}
                type="button"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold text-lg py-3.5 rounded-xl hover:bg-gray-200 transition-all shadow-xl disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                )}
                Continue with Google
              </button>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={switchMode}
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
            <Link href="/admin/login" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">Clinician / Admin sign in →</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
