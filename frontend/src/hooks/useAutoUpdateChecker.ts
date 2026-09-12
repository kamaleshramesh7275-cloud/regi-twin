import { useState, useEffect } from "react";
import { api } from "../api";

interface AppVersionManifest {
  version: string;
  build_number: number;
  release_notes: string;
  apk_url: string;
  min_required_version?: string;
}

export function useAutoUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [manifest, setManifest] = useState<AppVersionManifest | null>(null);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await api.getAppVersion();
        if (res && res.version) {
          setManifest(res);
          // Compare build numbers or version strings
          const currentVersion = "2.0.0";
          if (res.version !== currentVersion) {
            setUpdateAvailable(true);
          }
        }
      } catch (err) {
        // Silently ignore version check network errors
      }
    }

    checkVersion();
    // Periodically check every 5 minutes
    const interval = setInterval(checkVersion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { updateAvailable, manifest };
}
