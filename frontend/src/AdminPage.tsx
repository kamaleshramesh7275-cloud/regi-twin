import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Redirect shim — AdminPage has been replaced by AdminPortalShell.
 * Kept for import compatibility with App.tsx. Any navigation to /admin
 * is now handled by AdminPortalShell via the new sub-routes in App.tsx.
 */
export default function AdminPage() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/admin");
  }, [setLocation]);
  return null;
}
