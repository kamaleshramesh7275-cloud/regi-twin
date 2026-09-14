/**
 * Redirect shim — AdminPage has been replaced by AdminPortalShell.
 * Kept for import compatibility with App.tsx. Any navigation to /admin
 * is now handled by AdminPortalShell via the new sub-routes in App.tsx.
 * DO NOT add any redirect here — it would cause an infinite loop.
 */
export default function AdminPage() {
  return null;
}
