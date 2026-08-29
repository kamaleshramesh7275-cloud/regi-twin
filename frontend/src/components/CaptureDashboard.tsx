import React, { useState, useEffect } from 'react';
import { Play, Activity, Clock, AlertTriangle, History } from 'lucide-react';
import { api } from '../api';
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
        <div className="text-slate-400 text-sm animate-pulse">Loading captures...</div>
      ) : captures.length === 0 ? (
        <div className="text-slate-500 text-sm italic">No captures found. Complete a session first.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {captures.map((cap) => (
            <div 
              key={cap.id} 
              onClick={() => handleSelectSession(cap.id)}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors group relative"
            >
              {/* Thumbnail Placeholder */}
              <div className="h-32 bg-slate-950 relative flex items-center justify-center border-b border-slate-800">
                <Play className="w-10 h-10 text-slate-700 group-hover:text-blue-500 transition-colors" />
                
                {/* Simulated Duration Tag */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-mono px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  00:15
                </div>

                {/* Simulated Anomaly Tag */}
                {cap.stability !== null && cap.stability < 0.7 && (
                  <div className="absolute top-2 left-2 bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    ANOMALY
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="text-white font-medium capitalize">{cap.task_type.replace('-', ' ')}</div>
                <div className="text-slate-400 text-xs mt-1">
                  {new Date(cap.timestamp).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
