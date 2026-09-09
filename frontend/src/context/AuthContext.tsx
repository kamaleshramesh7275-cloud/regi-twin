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
  const [user, setUser] = useState<User | null>(null);
  const [googleFitToken, setGoogleFitToken] = useState<string | null>(() => {
    return localStorage.getItem("googleFitToken");
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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
      await connectGoogleFit();
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email registration failed", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setGoogleFitToken(null);
    localStorage.removeItem("googleFitToken");
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
