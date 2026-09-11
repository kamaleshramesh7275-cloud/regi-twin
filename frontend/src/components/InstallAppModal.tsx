import React, { useState } from "react";
import { X, Download, Share, PlusSquare, Smartphone, Monitor, ShieldCheck, Zap, WifiOff, Sparkles, CheckCircle2, ArrowRight, MoreVertical } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const {
    isNativePromptAvailable,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall
  } = usePWAInstall();

  const [hasClickedInstall, setHasClickedInstall] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyOriginUrl = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "http://172.17.3.75:5173";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleInstallClick = async () => {
    setHasClickedInstall(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
    
    // 1. Try native browser installation prompt if available
    if (isNativePromptAvailable) {
      const res = await promptInstall();
      if (res === "accepted") {
        setTimeout(() => {
          onClose();
        }, 800);
        return;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md anim-fade">
      <div 
        className="relative w-full max-w-lg bg-[#0B0F19] border border-blue-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-blue-500/10 text-slate-100 max-h-[88vh] overflow-y-auto scrollbar-hide"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow ambient backgrounds */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
          aria-label="Close installation modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/25 shrink-0">
            <img src="/pwa-192x192.png" alt="PhysioTwin App Icon" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" /> Progressive Web Application
            </div>
            <h3 className="text-xl font-black text-white">Install PhysioTwin</h3>
            <p className="text-xs text-slate-400">Experience native speed & full offline capability</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-lg text-white">App Already Installed!</h4>
            <p className="text-xs text-slate-300">
              PhysioTwin is installed on your device. You can launch it directly from your home screen or application launcher.
            </p>
            <button
              onClick={onClose}
              className="btn-primary w-full py-3 text-xs font-bold mt-2 cursor-pointer"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center space-y-1">
                <Zap className="w-5 h-5 text-blue-400 mx-auto" />
                <span className="text-[11px] font-bold text-white block">Instant Launch</span>
                <span className="text-[9px] text-slate-400 block leading-tight">Zero browser lag</span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center space-y-1">
                <WifiOff className="w-5 h-5 text-emerald-400 mx-auto" />
                <span className="text-[11px] font-bold text-white block">100% Offline</span>
                <span className="text-[9px] text-slate-400 block leading-tight">Workouts cached</span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center space-y-1">
                <ShieldCheck className="w-5 h-5 text-indigo-400 mx-auto" />
                <span className="text-[11px] font-bold text-white block">No App Store</span>
                <span className="text-[9px] text-slate-400 block leading-tight">Direct 1-tap install</span>
              </div>
            </div>

            {/* Universal Install & APK Download Actions */}
            <div className="space-y-2.5">
              <a
                href="/PhysioTwin.apk"
                download="PhysioTwin.apk"
                className="btn-primary w-full py-4 text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/25 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 border-none rounded-2xl cursor-pointer text-white transition-all transform active:scale-98 no-underline"
              >
                <Download className="w-5 h-5 text-white animate-bounce" />
                Download Android APK (41 MB)
              </a>

              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                {isNativePromptAvailable ? "Install Standalone PWA (1-Tap)" : "Install Web App via Chrome"}
              </button>
              
              <p className="text-[11px] text-center text-slate-400">
                Full Native Android APK with 3D Holographic Twin, Camera Motion Capture, Workout Strain &amp; Clinic OCR.
              </p>
            </div>

            {/* Clicked Install Action Guidance Banner */}
            {hasClickedInstall && !isNativePromptAvailable && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2.5 anim-up">
                <MoreVertical className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <div className="font-bold text-white">To Finish Installing on Your Phone:</div>
                  <div className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
                    Tap Chrome's <strong>⋮ (3 dots)</strong> in the top-right corner &rarr; tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* Android WebAPK Full App Tip */}
            {isAndroid && (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between font-bold text-blue-300">
                  <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-blue-400" /> Enable Full Standalone Install (WebAPK)</span>
                  <button 
                    onClick={copyOriginUrl}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 cursor-pointer"
                  >
                    {copied ? "Copied URL!" : "Copy IP URL"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  If Chrome on your phone doesn't show "Install app", open <code className="text-blue-400 bg-white/5 px-1 py-0.5 rounded">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> in Chrome, paste <strong className="text-white">http://172.17.3.75:5173</strong>, tap <strong>Relaunch</strong>, and Chrome will install it as an independent native app!
                </p>
              </div>
            )}

            {/* Platform Tailored Instructions (shown automatically or when button tapped) */}
            {isIOS ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                  <Smartphone className="w-4 h-4 text-blue-400" /> Instructions for iPhone / iPad (Safari)
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <p>
                      Tap the <strong className="text-white">Share button</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> in Safari's bottom toolbar.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <p>
                      Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-blue-400" />.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                    <p>
                      Tap <strong className="text-white">"Add"</strong> in the top right to install PhysioTwin on your home screen.
                    </p>
                  </div>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400" /> Android Installation Steps
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">Chrome / Samsung</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <p>
                      Tap the <strong className="text-white">Chrome menu</strong> <MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /> (top right 3 dots).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <p>
                      Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                    <p>
                      Tap <strong className="text-white">"Install"</strong> to launch PhysioTwin standalone offline.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Monitor className="w-4 h-4" /> Desktop Chrome / Edge / Brave
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Look for the <strong className="text-white">Install App icon (⊕ or ⬇)</strong> on the right side of your browser's address bar, or open your browser menu (⋮) and select <strong className="text-white">"Install PhysioTwin"</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500">
            PhysioTwin PWA v1.3.0 • Biomechanical Motion Capture & Autonomic Twin Engine
          </p>
        </div>
      </div>
    </div>
  );
};
