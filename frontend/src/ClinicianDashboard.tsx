import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Redirect shim — ClinicianDashboard has been absorbed into AdminPortalShell.
 * Kept for the /clinician-dashboard legacy route in App.tsx.
 * The /clinician route now goes directly to AdminPortalShell.
 */
export default function ClinicianDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/clinician");
  }, [setLocation]);
  return null;
}
