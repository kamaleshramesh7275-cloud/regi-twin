import React, { useState, useEffect } from 'react';
import { Play, Activity, Clock, AlertTriangle, History } from 'lucide-react';
import { api } from '../api';
import { captureHistoryStore } from '../lib/captureHistoryStore';
import { SessionDataReplay } from './SessionDataReplay';

export function CaptureDashboard({ userId }: { userId: string }) {
  const [captures, setCaptures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [replayData, setReplayData] = useState<any>(null);

  useEffect(() => {
    loadCaptures();
  }, [userId]);

  const loadCaptures = async () => {
    setLoading(true);
    try {
      const hist = await api.getSessionHistory(userId);
      setCaptures(hist);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      // Simulate API call for replay data since we added this endpoint
      const res = await fetch(`http://localhost:8000/captures/${sessionId}/replay`);
      const data = await res.json();
      setReplayData(data);
      setSelectedSessionId(sessionId);
    } catch (e) {
      console.error("Failed to fetch replay", e);
    }
  };

  if (selectedSessionId && replayData) {
    return (
      <div className="w-full">
        <button 
          onClick={() => setSelectedSessionId(null)} 
          className="mb-4 text-sm text-slate-400 hover:text-white flex items-center gap-2"
        >
          <History className="w-4 h-4" /> Back to Captures
        </button>
        <SessionDataReplay 
          kinematics={replayData.kinematics} 
          anomalies={replayData.anomalies} 
          wearable={replayData.wearable} 
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="text-blue-500 w-6 h-6" />
          LATEST CAPTURES
        </h2>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm animate-pulse">Loading capture history...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {captureHistoryStore.getHistory().map((cap) => (
              <div 
                key={cap.id} 
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{cap.exerciseType}</h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {new Date(cap.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })} &middot; {cap.durationSec}s session
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Symmetry {cap.bilateralSymmetryPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase">Valgus Angle</div>
                    <div className="font-bold text-white mt-0.5">{cap.peakValgusAngle}°</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase">Peak Force</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{cap.grfPeakBW}x BW</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase">Form Decay</div>
                    <div className="font-bold text-amber-400 mt-0.5">Rep {cap.formDecayBreakdownRep}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                  <span className="text-emerald-400 font-bold">AI Clinical Insight: </span>
                  {cap.llmSummary}
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Prescribed Drills:</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {cap.recommendedDrills.map((drill, idx) => (
                      <span key={idx} className="text-[10px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {drill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
