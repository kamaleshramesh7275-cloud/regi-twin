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
      const { isNewUser } = await loginWithGoogle();
      if (isNewUser || isRegister) {
        setLocation("/onboarding");
      } else {
        setLocation(getPostLoginDest());
      }
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
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Reset Password Modal */}
      {showReset && (
        <ResetPasswordModal
          onClose={() => setShowReset(false)}
          resetPassword={resetPassword}
        />
      )}

      {/* Ambient background lights */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation Bar */}
      <header className="relative z-30 w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight">PhysioTwin</span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">Back to Overview</Link>
          <Link href="/admin/login" className="text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/30 px-3 py-1.5 rounded-lg bg-emerald-500/10">Clinician Sign In</Link>
        </div>
      </header>

      {/* Main Split Authentication Section */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 md:py-16 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Brand & Security Guarantees */}
          <div className="hidden lg:flex flex-col space-y-6 text-left pr-4">
            <div className="pt-section-label text-emerald-400">BIOMECHANICAL PLATFORM ACCESS</div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              Access Your Personal <br />
              Musculoskeletal Digital Twin
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Sign in to view real-time joint kinematic history, acute-to-chronic workload strain calculations, and personalized LLM recovery insights.
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-900">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">100% On-Device Pose Kinematics Execution</p>
              </div>
              <div className="flex items-start gap-3">
                <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">LLM Diagnostic Advice &amp; ACWR Fatigue Thresholds</p>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">Sync with Google Fit, Garmin &amp; Health Platforms</p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Form Card */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
              
              {/* Header Mode Switcher */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isRegister ? "Create Account" : "Welcome Back"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isRegister ? "Start tracking your movement baseline" : "Enter your credentials to continue"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {isRegister ? "Sign In →" : "Register →"}
                </button>
              </div>

              {/* Global Auth Error */}
              {authError && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2"
                >
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Email / Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="pt-section-label block mb-1.5">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2.5 text-xs text-white outline-none focus:border-slate-700 transition-colors placeholder:text-slate-600 ${
                      emailError ? "border-red-500/60" : "border-slate-800"
                    }`}
                    autoComplete="email"
                  />
                  {emailError && (
                    <p className="text-red-400 text-[11px] mt-1 ml-0.5">{emailError}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="pt-section-label">Password</label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => setShowReset(true)}
                        className="text-[11px] text-slate-400 hover:text-white transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2.5 pr-10 text-xs text-white outline-none focus:border-slate-700 transition-colors placeholder:text-slate-600 ${
                        passwordError ? "border-red-500/60" : "border-slate-800"
                      }`}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-red-400 text-[11px] mt-1 ml-0.5">{passwordError}</p>
                  )}
                  {isRegister && <StrengthBar password={password} />}
                </div>

                <button
                  id="auth-submit-button"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoggingIn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isLoggingIn
                    ? "Authenticating..."
                    : isRegister
                    ? "Create Patient Account"
                    : "Sign In to Dashboard"}
                </button>
              </form>

              <div className="flex items-center gap-4">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="pt-section-label text-[10px]">OR</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* Google OAuth Button */}
              <button
                id="google-login-button"
                onClick={handleGoogleLogin}
                type="button"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                )}
                Continue with Google
              </button>

              {/* Direct Clinician Shortcut */}
              <div className="pt-2 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-500">
                  Are you a clinician or healthcare administrator?{" "}
                  <Link href="/admin/login" className="text-emerald-400 hover:underline font-semibold">
                    Sign in to Clinician Admin →
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>&copy; 2026 PhysioTwin System &middot; Privacy-First Musculoskeletal Diagnostics</p>
      </footer>

    </div>
  );
}

