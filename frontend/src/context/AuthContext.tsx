import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  getIdTokenResult,
  getAdditionalUserInfo,
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
  loginWithGoogle: () => Promise<{ user: User; isNewUser: boolean }>;
  connectGoogleFit: () => Promise<string | null>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshRole: () => Promise<void>;
  loginWithAdminCode: (code: string) => Promise<boolean>;
  loginAsNewAthlete: (profile: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractRole(tokenResult: IdTokenResult | null): UserRole {
  const claims = tokenResult?.claims ?? {};
  const raw = claims["role"] as string | undefined;
  if (raw === "clinician" || raw === "superadmin") return raw;
  return "client";
}

function getLocalAthleteUser(): User | null {
  try {
    const raw = localStorage.getItem("pt_current_user_profile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      uid: p.uid || "athlete-user",
      email: p.email || "athlete@physiotwin.local",
      displayName: p.full_name || p.fullName || "Athlete User",
      phoneNumber: p.phone_number || p.phoneNumber || "",
      emailVerified: true,
      getIdToken: async () => "athlete-token",
      getIdTokenResult: async () => ({
        token: "athlete-token",
        claims: { role: "client" },
      }),
    } as unknown as User;
  } catch {
    return null;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────────

const MOCK_ADMIN_USER = {
  uid: "admin-superadmin",
  email: "admin@physiotwin.com",
  displayName: "Super Admin",
  emailVerified: true,
  getIdToken: async () => "admin-code-token",
  getIdTokenResult: async () => ({
    token: "admin-code-token",
    claims: { role: "superadmin" },
  }),
} as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasAdminSession = () => localStorage.getItem("physiotwin_admin_code_session") === "admin123";

  // Check persisted active user session in localStorage
  const getPersistedSessionUser = (): User | null => {
    try {
      const raw = localStorage.getItem("physiotwin_active_session");
      if (!raw) return null;
      const s = JSON.parse(raw);
      return {
        uid: s.uid,
        email: s.email,
        displayName: s.displayName,
        emailVerified: true,
        getIdToken: async () => s.idToken || "persisted-token",
        getIdTokenResult: async () => ({
          token: s.idToken || "persisted-token",
          claims: { role: s.role || "client" },
        }),
      } as unknown as User;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(() => {
    if (DEV_BYPASS) return DEV_MOCK_USER;
    if (hasAdminSession()) return MOCK_ADMIN_USER;
    return getPersistedSessionUser();
  });
  const [role, setRole] = useState<UserRole>(() => {
    if (DEV_BYPASS || hasAdminSession()) return "superadmin";
    const p = getPersistedSessionUser();
    if (p) return "client";
    return "client";
  });
  const [idToken, setIdToken] = useState<string | null>(() => {
    if (DEV_BYPASS) return "dev-bypass-token";
    if (hasAdminSession()) return "admin-code-token";
    const p = localStorage.getItem("physiotwin_active_session");
    if (p) return "persisted-token";
    return null;
  });
  const [googleFitToken, setGoogleFitToken] = useState<string | null>(() =>
    localStorage.getItem("googleFitToken")
  );
  const [loading, setLoading] = useState(false);

  // ── Dev bypass: skip Firebase entirely ─────────────────────────────────────
  useEffect(() => {
    if (DEV_BYPASS) {
      console.warn(
        "%c[PhysioTwin] DEV AUTH BYPASS ACTIVE — all routes accessible as superadmin.",
        "background:#1e3a5f;color:#60a5fa;padding:4px 8px;border-radius:4px;font-weight:bold;"
      );
    }
  }, []);

  // ── Resolve role from token claims ─────────────────────────────────────────
  const resolveRole = useCallback(async (u: User | null) => {
    if (hasAdminSession()) {
      setRole("superadmin");
      setIdToken("admin-code-token");
      return;
    }
    if (!u) {
      const localAthlete = getLocalAthleteUser();
      if (localAthlete) {
        setUser(localAthlete);
        setRole("client");
        setIdToken("athlete-token");
        return;
      }
      setRole("client");
      setIdToken(null);
      return;
    }
    try {
      const tokenResult = await getIdTokenResult(u, false);
      setRole(extractRole(tokenResult));
      setIdToken(tokenResult.token);
    } catch {
      setRole("client");
      setIdToken(null);
    }
  }, []);

  // ── Listen for Firebase auth state changes ─────────────────────────────────
  useEffect(() => {
    if (DEV_BYPASS) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (hasAdminSession()) {
        setUser(MOCK_ADMIN_USER);
        setRole("superadmin");
        setIdToken("admin-code-token");
        setLoading(false);
        return;
      }
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.setItem("physiotwin_active_session", JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: "client"
        }));
        await resolveRole(firebaseUser);
      } else {
        const localAthlete = getLocalAthleteUser();
        if (localAthlete) {
          setUser(localAthlete);
          setRole("client");
          setIdToken("athlete-token");
        } else {
          setUser(null);
          setRole("client");
          setIdToken(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [resolveRole]);

  // ── Admin Code Login ("admin123") ──────────────────────────────────────────
  const loginWithAdminCode = async (code: string): Promise<boolean> => {
    if (code.trim() === "admin123") {
      localStorage.setItem("physiotwin_admin_code_session", "admin123");
      setUser(MOCK_ADMIN_USER);
      setRole("superadmin");
      setIdToken("admin-code-token");
      setLoading(false);
      return true;
    }
    return false;
  };

  // ── Athlete Session Login ──────────────────────────────────────────────────
  const loginAsNewAthlete = (profile: any) => {
    localStorage.setItem("pt_current_user_profile", JSON.stringify(profile));
    const athleteUser = {
      uid: profile.uid || `user-${Date.now()}`,
      email: profile.email || "athlete@physiotwin.local",
      displayName: profile.full_name || profile.fullName || "Athlete User",
      phoneNumber: profile.phone_number || profile.phoneNumber || "",
      emailVerified: true,
      getIdToken: async () => "athlete-token",
      getIdTokenResult: async () => ({
        token: "athlete-token",
        claims: { role: "client" },
      }),
    } as unknown as User;
    setUser(athleteUser);
    setRole("client");
    setIdToken("athlete-token");
    setLoading(false);
  };

  // ── Refresh role (call after backend sets custom claims) ───────────────────
  const refreshRole = useCallback(async () => {
    if (hasAdminSession()) {
      setRole("superadmin");
      return;
    }
    if (!user) return;
    try {
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

  // ── Google sign-in (Accounts created strictly via Google OAuth) ─────────────
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(result);
      return {
        user: result.user,
        isNewUser: !!additionalInfo?.isNewUser
      };
    } catch (popupErr: any) {
      if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/operation-not-supported-in-this-environment') {
        console.warn("Popup blocked or not supported in mobile webview, trying redirect...", popupErr);
        await signInWithRedirect(auth, googleProvider);
        return { user: null as any, isNewUser: false };
      }
      throw popupErr;
    }
  };

  // ── Email sign-in ──────────────────────────────────────────────────────────
  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // ── Email registration ─────────────────────────────────────────────────────
  const registerWithEmail = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Non-fatal
    }
  };

  // ── Password reset ─────────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const logout = async () => {
    localStorage.removeItem("physiotwin_admin_code_session");
    localStorage.removeItem("physiotwin_active_session");
    if (!DEV_BYPASS) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn("[auth] signOut error:", err);
      }
    }
    localStorage.removeItem("googleFitToken");
    localStorage.removeItem("physiotwin_logged_out");
    localStorage.removeItem("physiotwin_user_email");
    setGoogleFitToken(null);
    setUser(null);
    setRole("client");
    setIdToken(null);
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
        loginWithAdminCode,
        loginAsNewAthlete,
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
