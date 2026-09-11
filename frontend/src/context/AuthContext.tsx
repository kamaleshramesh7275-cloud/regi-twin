import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  getIdTokenResult,
} from "firebase/auth";
import type { User, IdTokenResult } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

// ── Dev Bypass ─────────────────────────────────────────────────────────────────
// Set VITE_DEV_BYPASS_AUTH=true in frontend/.env to skip Firebase and access
// all routes locally without needing Firebase Auth to be enabled.
const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

const DEV_MOCK_USER = DEV_BYPASS ? ({
  uid: "dev-superadmin",
  email: "dev@physiotwin.local",
  displayName: "Dev SuperAdmin",
  emailVerified: true,
  getIdToken: async () => "dev-bypass-token",
  getIdTokenResult: async () => ({
    token: "dev-bypass-token",
    claims: { role: "superadmin" },
  }),
} as unknown as User) : null;

// ── Types ──────────────────────────────────────────────────────────────────────

export type UserRole = "client" | "clinician" | "superadmin";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  idToken: string | null;
  googleFitToken: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  connectGoogleFit: () => Promise<string | null>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractRole(tokenResult: IdTokenResult | null): UserRole {
  const claims = tokenResult?.claims ?? {};
  const raw = claims["role"] as string | undefined;
  if (raw === "clinician" || raw === "superadmin") return raw;
  return "client";
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_BYPASS ? DEV_MOCK_USER : null);
  const [role, setRole] = useState<UserRole>(DEV_BYPASS ? "superadmin" : "client");
  const [idToken, setIdToken] = useState<string | null>(DEV_BYPASS ? "dev-bypass-token" : null);
  const [googleFitToken, setGoogleFitToken] = useState<string | null>(() =>
    localStorage.getItem("googleFitToken")
  );
  const [loading, setLoading] = useState(!DEV_BYPASS); // bypass = never loading

  // ── Dev bypass: skip Firebase entirely ─────────────────────────────────────
  useEffect(() => {
    if (DEV_BYPASS) {
      console.warn(
        "%c[PhysioTwin] DEV AUTH BYPASS ACTIVE — all routes accessible as superadmin. Remove VITE_DEV_BYPASS_AUTH from .env for production.",
        "background:#1e3a5f;color:#60a5fa;padding:4px 8px;border-radius:4px;font-weight:bold;"
      );
    }
  }, []);

  // ── Resolve role from token claims ─────────────────────────────────────────
  const resolveRole = useCallback(async (u: User | null) => {
    if (!u) {
      setRole("client");
      setIdToken(null);
      return;
    }
    try {
      // forceRefresh=false: use cached token unless expired
      const tokenResult = await getIdTokenResult(u, false);
      setRole(extractRole(tokenResult));
      setIdToken(tokenResult.token);
    } catch {
      // If token fetch fails, fall back gracefully
      setRole("client");
      setIdToken(null);
    }
  }, []);

  // ── Listen for Firebase auth state changes ─────────────────────────────────
  useEffect(() => {
    if (DEV_BYPASS) return; // skip Firebase listener in dev bypass mode
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await resolveRole(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [resolveRole]);

  // ── Refresh role (call after backend sets custom claims) ───────────────────
  const refreshRole = useCallback(async () => {
    if (!user) return;
    try {
      // forceRefresh=true: fetch a new token with updated claims
      const tokenResult = await getIdTokenResult(user, true);
      setRole(extractRole(tokenResult));
      setIdToken(tokenResult.token);
    } catch (err) {
      console.warn("[auth] refreshRole failed:", err);
    }
  }, [user]);

  // ── Google Fit (OAuth scopes only) ─────────────────────────────────────────
  const connectGoogleFit = async (): Promise<string | null> => {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setGoogleFitToken(credential.accessToken);
      localStorage.setItem("googleFitToken", credential.accessToken);
      return credential.accessToken;
    }
    return null;
  };

  // ── Google sign-in ─────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged handles user + role update
  };

  // ── Email sign-in ──────────────────────────────────────────────────────────
  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged handles the rest
  };

  // ── Email registration ─────────────────────────────────────────────────────
  const registerWithEmail = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Optionally send verification email
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Non-fatal — don't throw if verification email fails
    }
    // onAuthStateChanged handles the rest
  };

  // ── Password reset ─────────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const logout = async () => {
    if (DEV_BYPASS) {
      console.warn("[auth] DEV BYPASS: logout is a no-op in dev mode.");
      return;
    }
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("[auth] signOut error:", err);
    }
    localStorage.removeItem("googleFitToken");
    localStorage.removeItem("physiotwin_logged_out");
    localStorage.removeItem("physiotwin_user_email");
    setGoogleFitToken(null);
    // onAuthStateChanged will set user=null + role='client'
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        idToken,
        googleFitToken,
        loading,
        loginWithGoogle,
        connectGoogleFit,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
