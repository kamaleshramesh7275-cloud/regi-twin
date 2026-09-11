import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  googleFitToken: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  connectGoogleFit: () => Promise<string | null>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const isLoggedOut = localStorage.getItem("physiotwin_logged_out") === "true";
    if (isLoggedOut) return null;
    const storedEmail = localStorage.getItem("physiotwin_user_email") || "test@example.com";
    return { uid: "test-user", email: storedEmail, displayName: "Demo Athlete" } as User;
  });
  const [googleFitToken, setGoogleFitToken] = useState<string | null>(() => {
    return localStorage.getItem("googleFitToken");
  });
  const [loading, setLoading] = useState(false);

  const connectGoogleFit = async (): Promise<string | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        setGoogleFitToken(credential.accessToken);
        localStorage.setItem("googleFitToken", credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (error) {
      console.error("Google Fit authorization failed", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      localStorage.removeItem("physiotwin_logged_out");
      await connectGoogleFit();
      setUser({ uid: "google-user", email: "google.athlete@physiotwin.com", displayName: "Google Athlete" } as User);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, _pass: string) => {
    localStorage.removeItem("physiotwin_logged_out");
    localStorage.setItem("physiotwin_user_email", email);
    const mockUser = { uid: "test-user", email, displayName: email.split("@")[0] || "Demo Athlete" } as User;
    setUser(mockUser);
  };

  const registerWithEmail = async (email: string, _pass: string) => {
    localStorage.removeItem("physiotwin_logged_out");
    localStorage.setItem("physiotwin_user_email", email);
    const mockUser = { uid: "test-user", email, displayName: email.split("@")[0] || "Demo Athlete" } as User;
    setUser(mockUser);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Firebase signout fallback:", err);
    }
    localStorage.setItem("physiotwin_logged_out", "true");
    localStorage.removeItem("physiotwin_user_email");
    localStorage.removeItem("googleFitToken");
    setGoogleFitToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, googleFitToken, loading, loginWithGoogle, connectGoogleFit, loginWithEmail, registerWithEmail, logout }}>
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
