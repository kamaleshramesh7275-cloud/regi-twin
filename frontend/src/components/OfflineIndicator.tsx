import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { offlineStorage, type OfflineMutation } from "../lib/offlineStorage";
import { api } from "../api";

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  const checkPending = async () => {
    const mutations = await offlineStorage.getPendingMutations();
    setPendingCount(mutations.length);
  };

  const handleSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await offlineStorage.flushQueue(api);
      if (res.synced > 0) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      }
      await checkPending();
    } catch (err) {
      console.warn("Offline sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    checkPending();

    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    const handleQueueChange = () => {
      checkPending();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue-changed", handleQueueChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue-changed", handleQueueChange);
    };
  }, []);

  if (isOnline && pendingCount === 0 && !justSynced) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 anim-up">
      {!isOnline ? (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 backdrop-blur-md shadow-xl text-xs font-semibold">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Offline Mode — Changes Cached Locally</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-[10px] font-bold">
              {pendingCount} queued
            </span>
          )}
        </div>
      ) : justSynced ? (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 backdrop-blur-md shadow-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Offline changes synced successfully!</span>
        </div>
      ) : pendingCount > 0 ? (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 transition-colors backdrop-blur-md shadow-xl text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Syncing..." : `Sync ${pendingCount} offline records`}</span>
        </button>
      ) : null}
    </div>
  );
};
