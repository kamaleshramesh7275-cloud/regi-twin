import { useState, useEffect } from 'react'
import { Link, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Onboarding from "./Onboarding";
import CaptureEngine from "./CaptureEngine";
import Dashboard from "./Dashboard";
import DemoDashboard from "./DemoDashboard";
import { NutritionRecovery } from "./NutritionRecovery";
import { WorkoutStrain } from "./WorkoutStrain";

import { Camera, Brain, Target, Shield, ArrowRight, Download, Sparkles, Smartphone, WifiOff } from "lucide-react";
import { AvatarProvider } from "./AvatarContext";
import { InstallAppModal } from "./components/InstallAppModal";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { usePWAInstall } from "./hooks/usePWAInstall";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

import CapturesPage from "./CapturesPage";
import { HistoryPage, TimelinePage, InsightsPage } from "./DummyPages";
import FullMedicalHistory from "./FullMedicalHistory";
import TwinPage from "./TwinPage";
import SimulatorPage from "./SimulatorPage";
import LeaderboardPage from "./LeaderboardPage";
import SettingsPage from "./SettingsPage";
import ProgramsPage from "./ProgramsPage";
import AnalyticsPage from "./AnalyticsPage";
import CommunityPage from "./CommunityPage";
import ClinicPage from "./ClinicPage";
import ClinicRosterPage from "./ClinicRosterPage";
import MedicationPage from "./MedicationPage";
import VitalsPage from "./VitalsPage";
import MentalReadinessPage from "./MentalReadinessPage";
import WikiPage from "./WikiPage";
import AchievementsPage from "./AchievementsPage";
import ExerciseLibrary from "./ExerciseLibrary";
import WorkoutLogger from "./WorkoutLogger";
import LoginPage from "./LoginPage";
import EntryPage from "./EntryPage";
import AdminPage from "./AdminPage";
import ClinicianDashboard from "./ClinicianDashboard";
import AdminPortalShell from "./admin/AdminPortalShell";
import AdminLoginPage from "./admin/AdminLoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { UserRole } from "./context/AuthContext";
import { ClinicInsightsProvider } from "./context/ClinicInsightsContext";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-sm text-white/50">Loading…</span></div></div>;
  if (!user) return null;

  return <Component {...rest} />;
}

/**
 * Route that requires a specific role (or superadmin which passes all checks).
 * Redirects to /dashboard if authenticated but wrong role, or /login if not authenticated.
 */
function RoleProtectedRoute({
  component: Component,
  allowedRoles,
  ...rest
}: {
  component: React.ComponentType<any>;
  allowedRoles: UserRole[];
  [key: string]: any;
}) {
  const { user, role, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Redirect unauthenticated users to the correct login page
      const isAdminRoute = allowedRoles.includes("clinician") || allowedRoles.includes("superadmin");
      setLocation(isAdminRoute ? "/admin/login" : "/login");
      return;
    }
    // Superadmin passes all role checks
    if (role !== "superadmin" && !allowedRoles.includes(role)) {
      setLocation("/dashboard");
    }
  }, [user, role, loading, setLocation, allowedRoles]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-sm text-white/50">Loading…</span></div></div>;
  if (!user) return null;
  if (role !== "superadmin" && !allowedRoles.includes(role)) return null;

  return <Component {...rest} />;
}

function AppContent() {
  const { user, role, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Role-aware redirect after sign-in: client → dashboard, clinician/superadmin → admin portal
  useEffect(() => {
    if (location === '/' && !loading && user) {
      if (role === 'clinician') {
        setLocation('/clinician');
      } else if (role === 'superadmin') {
        setLocation('/admin');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [location, user, role, loading, setLocation]);

  return (
    <AvatarProvider>
      <ClinicInsightsProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Switch>
          <Route path="/" component={EntryPage} />
          <Route path="/entry" component={EntryPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={Onboarding} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/capture" component={CaptureEngine} />
          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/demo" component={DemoDashboard} />
          
          {/* Protected Routes */}
          <Route path="/twin"><ProtectedRoute component={TwinPage} /></Route>
          <Route path="/simulator"><ProtectedRoute component={SimulatorPage} /></Route>
          <Route path="/medical-history"><ProtectedRoute component={FullMedicalHistory} /></Route>
          <Route path="/history"><ProtectedRoute component={FullMedicalHistory} /></Route>
          <Route path="/projection"><ProtectedRoute component={TwinPage} /></Route>
          <Route path="/leaderboard"><ProtectedRoute component={LeaderboardPage} /></Route>
          <Route path="/nutrition-recovery"><ProtectedRoute component={NutritionRecovery} /></Route>
          <Route path="/muscular-strain"><ProtectedRoute component={WorkoutStrain} /></Route>
          <Route path="/exercises"><ProtectedRoute component={ExerciseLibrary} /></Route>
          <Route path="/workout-logger"><ProtectedRoute component={WorkoutLogger} /></Route>
          <Route path="/timeline"><ProtectedRoute component={TimelinePage} /></Route>
          <Route path="/insights"><ProtectedRoute component={InsightsPage} /></Route>
          <Route path="/settings"><ProtectedRoute component={SettingsPage} /></Route>
          <Route path="/programs"><ProtectedRoute component={ProgramsPage} /></Route>
          <Route path="/analytics"><ProtectedRoute component={AnalyticsPage} /></Route>
          <Route path="/community"><ProtectedRoute component={CommunityPage} /></Route>
          <Route path="/clinic/roster"><ProtectedRoute component={ClinicRosterPage} /></Route>
          <Route path="/clinic"><ProtectedRoute component={ClinicPage} /></Route>
          <Route path="/meds"><ProtectedRoute component={MedicationPage} /></Route>
          <Route path="/vitals"><ProtectedRoute component={VitalsPage} /></Route>
          <Route path="/readiness"><ProtectedRoute component={MentalReadinessPage} /></Route>
          <Route path="/wiki"><ProtectedRoute component={WikiPage} /></Route>
          <Route path="/achievements"><ProtectedRoute component={AchievementsPage} /></Route>

          {/* Admin login — public, no auth required */}
          <Route path="/admin/login" component={AdminLoginPage} />

          {/* Admin Portal — sub-routed shell. /admin/:page? catches all admin sub-pages.
               /clinician mirrors /admin for clinician-role direct links / bookmarks. */}
          <Route path="/admin/:page">
            {(params: { page?: string }) => (
              <RoleProtectedRoute
                component={AdminPortalShell}
                page={params.page ?? ""}
                allowedRoles={["clinician", "superadmin"]}
              />
            )}
          </Route>
          <Route path="/admin">
            <RoleProtectedRoute
              component={AdminPortalShell}
              page=""
              allowedRoles={["clinician", "superadmin"]}
            />
          </Route>
          {/* /clinician → same shell, overview page — for clinician-role bookmarks */}
          <Route path="/clinician">
            <RoleProtectedRoute
              component={AdminPortalShell}
              page=""
              allowedRoles={["clinician", "superadmin"]}
            />
          </Route>
          {/* Redirect shims for old flat routes */}
          <Route path="/clinician-dashboard">
            <RoleProtectedRoute
              component={ClinicianDashboard}
              allowedRoles={["clinician", "superadmin"]}
            />
          </Route>

          <Route>
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
              <div className="text-6xl font-black text-gradient">404</div>
              <div className="text-muted-foreground">Page not found</div>
              <Link href="/" className="btn btn-primary mt-4">Go Home</Link>
            </div>
          </Route>
          </Switch>
          <OfflineIndicator />
        </div>
      </ClinicInsightsProvider>
    </AvatarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
