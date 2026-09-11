import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, AlertCircle, Watch, RefreshCw, CheckCircle2, 
  ExternalLink, XCircle, HeartPulse, Droplets, Moon, Footprints, Info
} from "lucide-react";
import { 
  checkAvailability, requestVitalsPermissions, 
  syncFromHealthConnect, openHealthConnectSettings 
} from "./lib/healthConnect";
import type { HealthConnectAvailability } from "./types/vitals";

interface HealthConnectModalProps {
  userId: string;
  onClose: () => void;
  onSyncComplete: () => void;
}

export default function HealthConnectModal({ userId, onClose, onSyncComplete }: HealthConnectModalProps) {
  const [availability, setAvailability] = useState<HealthConnectAvailability | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [step, setStep] = useState<"intro" | "syncing" | "success" | "error">("intro");
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    async function loadStatus() {
      setChecking(true);
      const res = await checkAvailability();
      setAvailability(res);
      setChecking(false);
    }
    loadStatus();
  }, []);

  const handleRequestAndSync = async () => {
    try {
      setSyncing(true);
      setStep("syncing");
      setStatusMsg("Requesting Android Health Connect read permissions...");

      const permRes = await requestVitalsPermissions();
      if (!permRes.granted && permRes.error) {
        setStep("error");
        setStatusMsg(permRes.error || "Health Connect permissions were not granted.");
        setSyncing(false);
        return;
      }

      setStatusMsg("Reading Realme Watch vitals stream from Health Connect...");
      const syncRes = await syncFromHealthConnect(userId);

      if (syncRes.success) {
        setStep("success");
        setStatusMsg(`Successfully synchronized ${syncRes.readingsCount} vital records from Health Connect!`);
        onSyncComplete();
      } else {
        setStep("error");
        setStatusMsg(syncRes.error || "Failed to synchronize readings.");
      }
    } catch (err: any) {
      setStep("error");
      setStatusMsg(err.message || "An unexpected error occurred during sync.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Realme Link &rarr; Health Connect Sync
              </h2>
              <p className="text-xs text-slate-400">
                Automated on-device vitals pipeline from your smartwatch.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Step: Intro / Explainer */}
        {step === "intro" && (
          <div className="space-y-4">
            
            {/* Architecture Explainer */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> How It Works
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-center">
                <span>⌚ Realme Watch</span>
                <span className="text-slate-500">&rarr;</span>
                <span>📱 Realme Link</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="text-emerald-400 font-bold">💚 Health Connect</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="text-cyan-400 font-bold">PhysioTwin</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Because Realme has no public cloud API, PhysioTwin reads directly from Android's on-device Health Connect vault.
              </p>
            </div>

            {/* Requested Data Types */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">Requested Watch Data Types</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-rose-400">
                  <HeartPulse className="w-4 h-4" />
                  <span>Heart Rate (Resting)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-cyan-400">
                  <Droplets className="w-4 h-4" />
                  <span>Blood Oxygen (SpO2)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-indigo-400">
                  <Moon className="w-4 h-4" />
                  <span>Sleep &amp; Stages</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-emerald-400">
                  <Footprints className="w-4 h-4" />
                  <span>Daily Steps</span>
                </div>
              </div>
            </div>

            {/* Known Limitations Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Important Sync Notes
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-200/90 space-y-0.5">
                <li><strong>30–60 min latency:</strong> Realme Link periodically pushes batches to Health Connect.</li>
                <li><strong>30-day initial limit:</strong> Android restricts first-time historical read access to ~30 days.</li>
                <li><strong>Prerequisite:</strong> Realme Link must have permission to write to Health Connect in phone settings.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={openHealthConnectSettings}
                className="text-xs text-slate-400 hover:text-cyan-400 font-semibold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Health Connect Settings
              </button>

              <button
                type="button"
                onClick={handleRequestAndSync}
                disabled={syncing || checking}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Connecting..." : "Grant Permissions & Sync"}
              </button>
            </div>

          </div>
        )}

        {/* Step: Syncing */}
        {step === "syncing" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin" />
            <div>
              <h3 className="text-base font-bold text-white">Syncing with Health Connect</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{statusMsg}</p>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sync Complete!</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm">{statusMsg}</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold mt-2"
            >
              Done / View Dashboard
            </button>
          </div>
        )}

        {/* Step: Error / Fallback */}
        {step === "error" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertCircle className="w-4 h-4" /> Synchronization Notice
              </div>
              <p>{statusMsg}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-2">
              <strong className="text-white block font-semibold">Troubleshooting Steps:</strong>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ensure you are running the native Android APK build on your phone.</li>
                <li>Open the <strong>Realme Link</strong> app &rarr; Profile &rarr; Third-Party Services &rarr; ensure <strong>Health Connect</strong> is turned ON.</li>
                <li>Verify your Realme Watch is paired and synced with Realme Link.</li>
              </ol>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={openHealthConnectSettings}
                className="text-xs text-cyan-400 hover:underline font-bold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Check App Permissions in Settings
              </button>

              <button
                type="button"
                onClick={() => setStep("intro")}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
