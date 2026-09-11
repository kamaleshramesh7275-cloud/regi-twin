import { createContext } from "react";

/**
 * Shared context for the Admin Portal client detail drawer.
 * Extracted to its own file to avoid circular imports between
 * AdminPortalShell (provider) and AdminOverview/AdminClinicReports (consumers).
 */

export interface ClientDetailCtx {
  openClientId: string | null;
  openClient: (id: string) => void;
  closeClient: () => void;
}

export const ClientDetailContext = createContext<ClientDetailCtx>({
  openClientId: null,
  openClient: () => {},
  closeClient: () => {},
});
