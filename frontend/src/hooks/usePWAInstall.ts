import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  // Platform Detection
  const userAgent = typeof window !== "undefined" ? window.navigator.userAgent.toLowerCase() : "";
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android|linux; u;/i.test(userAgent) || (typeof navigator !== "undefined" && /android/i.test(navigator.platform || ""));
  const isMac = /macintosh|mac os x/.test(userAgent) && !isIOS;
  const isWindows = /windows/.test(userAgent);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      
      setIsStandalone(Boolean(isStandaloneMode));
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("PhysioTwin PWA was successfully installed!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "manual_guide"> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return "accepted";
        }
        return "dismissed";
      } catch (err) {
        console.warn("PWA prompt error:", err);
        return "manual_guide";
      }
    }
    return "manual_guide";
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt) || isIOS || !isStandalone,
    isNativePromptAvailable: Boolean(deferredPrompt),
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    isMac,
    isWindows,
    promptInstall
  };
}
