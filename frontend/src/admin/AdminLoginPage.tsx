import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Globe2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  mapAuthError,
  isIgnorableAuthError,
  validateEmail,
  validatePassword,
} from "../lib/authErrors";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getAdminDest(role: string): string | null {
  if (role === "superadmin") return "/admin";
  if (role === "clinician") return "/clinician";
  return null; // client → not allowed
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const { loginWithGoogle, loginWithEmail, role, user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [accessError, setAccessError] = useState("");
  const [didAttemptLogin, setDidAttemptLogin] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailError = emailTouched ? validateEmail(email) : "";
  const passwordError = passwordTouched ? validatePassword(password, false) : "";

  // ── If already signed in and role is set, redirect immediately ─────────────
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    const dest = getAdminDest(role);
    if (dest) {
      setLocation(dest);
    }
  }, [user, role, loading, setLocation]);

  // ── After a login attempt completes, check role ────────────────────────────
  useEffect(() => {
    if (!didAttemptLogin) return;
    if (loading) return;
    if (!user) return; // Firebase rejected — authError handles UI
    const dest = getAdminDest(role);
    if (dest) {
      setLocation(dest);
    } else {
      // Signed in but wrong role
      setAccessError(
        "Your account has the 'client' role and cannot access the Admin Portal. " +
          "Please sign in via the regular User Portal instead."
      );
      setIsLoggingIn(false);
      setDidAttemptLogin(false);
    }
  }, [didAttemptLogin, user, role, loading, setLocation]);

  // ── Google login ───────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError("");
    setAccessError("");
    try {
      await loginWithGoogle();
      setDidAttemptLogin(true);
    } catch (error) {
      if (!isIgnorableAuthError(error)) {
        setAuthError(mapAuthError(error));
      }
      setIsLoggingIn(false);
    }
  };

  // ── Email / password login ─────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (validateEmail(email) || validatePassword(password, false)) return;
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setAuthError("");
    setAccessError("");
    try {
      await loginWithEmail(email.trim(), password);
      setDidAttemptLogin(true);
    } catch (error) {
      setAuthError(mapAuthError(error));
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030b14] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-[500px] h-[500px] bg-teal-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-cyan-500/8 blur-[140px] rounded-full" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo block */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center shadow-xl shadow-teal-900/50 mb-4">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black tracking-tight text-white">
              PhysioTwin
            </span>
            <span className="text-xs font-black uppercase tracking-[0.15em] text-teal-400 bg-teal-950/60 border border-teal-700/40 px-2 py-0.5 rounded-md">
              Admin
            </span>
          </div>
          <p className="text-sm text-white/40 text-center">
            Sign in to access the Admin Portal.
            <br />
            Clinician and Superadmin roles only.
          </p>
        </div>

        {/* Panel */}
        <div className="bg-white/[0.03] border border-teal-900/40 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
          {/* Access error — shown when a 'client' tries to use this page */}
          {accessError && (
            <div className="mb-5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{accessError}</span>
            </div>
          )}

          {/* Auth error */}
          {authError && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {authError}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-teal-800/40 hover:border-teal-600/50 text-white font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 mb-4 text-sm"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe2 className="w-4 h-4 text-teal-400" />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-xs text-white/30">or email</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="Admin email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors placeholder:text-white/25 ${
                    emailError
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-teal-500"
                  }`}
                  autoComplete="email"
                  required
                />
              </div>
              {emailError && (
                <p className="mt-1 text-xs text-red-400">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-colors placeholder:text-white/25 ${
                    passwordError
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-teal-500"
                  }`}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-red-400">{passwordError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="admin-login-btn"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-sm mt-1"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign in to Admin Portal{" "}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Role info callout */}
          <div className="mt-5 flex items-start gap-2.5 p-3 bg-teal-950/30 border border-teal-800/30 rounded-xl">
            <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p className="text-xs text-white/40 leading-relaxed">
              This portal is restricted to{" "}
              <span className="text-teal-400 font-semibold">clinician</span>{" "}
              and{" "}
              <span className="text-amber-400 font-semibold">superadmin</span>{" "}
              roles. Client accounts will see an access error.
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-5 flex flex-col items-center gap-2 text-sm text-white/30">
          <p>
            Regular user?{" "}
            <Link
              href="/login"
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              Go to User Portal login →
            </Link>
          </p>
          <Link
            href="/"
            className="text-white/20 hover:text-white/40 text-xs transition-colors"
          >
            ← Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
}
