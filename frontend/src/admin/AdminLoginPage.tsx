import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Stethoscope,
  Lock,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getAdminDest(role: string): string | null {
  if (role === "superadmin") return "/admin";
  if (role === "clinician") return "/admin";
  return null; // client → not allowed
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const { loginWithAdminCode, role, user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [adminCode, setAdminCode] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");

  // ── If already signed in and role is set, redirect immediately ─────────────
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    const dest = getAdminDest(role);
    if (dest) {
      setLocation(dest);
    }
  }, [user, role, loading, setLocation]);

  // ── Handle Admin Code submit ───────────────────────────────────────────────
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode.trim()) return;
    setIsLoggingIn(true);
    setAuthError("");
    try {
      const success = await loginWithAdminCode(adminCode.trim());
      if (success) {
        setLocation("/admin");
      } else {
        setAuthError("Invalid Admin Code. Please use the correct secret code.");
      }
    } catch {
      setAuthError("Failed to authenticate with Admin Code.");
    } finally {
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
              Admin Portal
            </span>
          </div>
          <p className="text-sm text-white/50 text-center mt-1">
            Secure Admin Access · Enter your Secret Code to continue
          </p>
        </div>

        {/* Panel */}
        <div className="bg-white/[0.03] border border-teal-900/40 rounded-2xl p-6 backdrop-blur-sm shadow-2xl space-y-4">
          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Admin Secret Code Form */}
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-teal-300 uppercase tracking-wider block mb-1">
                Admin Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 pointer-events-none" />
                <input
                  id="admin-code-input"
                  type="password"
                  placeholder="Enter Secret Admin Code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-slate-900/80 border border-teal-500/40 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono outline-none focus:border-teal-400 transition-colors"
                  required
                />
              </div>
              <p className="text-[11px] text-teal-400/80 mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3 text-teal-400" />
                This code is provided by your system administrator.
              </p>
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={isLoggingIn || !adminCode.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black py-3.5 px-4 rounded-xl transition-all shadow-lg cursor-pointer text-sm"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In to Admin Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Role info callout */}
          <div className="mt-4 flex items-start gap-2.5 p-3 bg-teal-950/40 border border-teal-800/40 rounded-xl">
            <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              The admin secret code grants full access to clinical analytics,
              user &amp; role management, system health telemetry, and platform
              settings.
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

