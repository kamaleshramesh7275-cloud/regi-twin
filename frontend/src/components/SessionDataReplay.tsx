import React, { useState, useEffect } from 'react';
import { Play, Pause, FastForward, SkipBack } from 'lucide-react';
import { MuscleHeatmap2D } from './MuscleHeatmap2D';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot
} from 'recharts';

interface KinematicsFrame {
  timestamp_ms: number;
  angles: { [key: string]: number };
  stress: { [key: string]: number };
}

interface Anomaly {
  timestamp_ms: number;
  type: string;
  description: string;
}

interface SessionDataReplayProps {
  kinematics: KinematicsFrame[];
  anomalies: Anomaly[];
  wearable?: {
    heart_rate?: number;
    hrv?: number;
    readiness_score?: number;
  };
}

export function SessionDataReplay({ kinematics, anomalies, wearable }: SessionDataReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const maxMs = kinematics.length > 0 ? kinematics[kinematics.length - 1].timestamp_ms : 0;

  // Find the exact or closest frame
  const currentFrame = kinematics.reduce((prev, curr) => 
    Math.abs(curr.timestamp_ms - currentMs) < Math.abs(prev.timestamp_ms - currentMs) ? curr : prev
  , kinematics[0] || { timestamp_ms: 0, angles: {}, stress: {} });

  useEffect(() => {
    let interval: any;
    if (isPlaying && currentMs < maxMs) {
      interval = setInterval(() => {
        setCurrentMs(prev => Math.min(prev + 100, maxMs)); // Advance by 100ms
      }, 100);
    } else if (currentMs >= maxMs) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentMs, maxMs]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMs(Number(e.target.value));
  };

  // Convert kinematics for Recharts
  const chartData = kinematics.map(k => ({
    time: (k.timestamp_ms / 1000).toFixed(1),
    time_ms: k.timestamp_ms,
    leftKnee: k.angles["Left Knee"] || 0,
    rightKnee: k.angles["Right Knee"] || 0,
  }));

  const activeAnomalies = anomalies.filter(a => Math.abs(a.timestamp_ms - currentMs) < 500);

  return (
    <div className="flex flex-col gap-6 w-full text-white bg-slate-900 p-6 rounded-xl border border-slate-800">
      
      {/* Top Section: Heatmap & Context Panel */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Heatmap Area */}
        <div className="flex-1 bg-slate-950 p-6 rounded-xl border border-slate-800 relative flex items-center justify-center">
          <h3 className="absolute top-4 left-4 text-sm font-bold text-slate-400 tracking-wider">STRESS DISTRIBUTION</h3>
          
          <MuscleHeatmap2D stressLevels={currentFrame?.stress || {}} className="h-64" />
          
          {/* Anomaly Overlay */}
          {activeAnomalies.length > 0 && (
            <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-md flex flex-col gap-1 shadow-lg shadow-red-500/10">
              <span className="text-xs font-black tracking-widest">ANOMALY DETECTED</span>
              {activeAnomalies.map((a, i) => (
                <span key={i} className="text-xs font-medium">{a.description}</span>
              ))}
            </div>
          )}
        </div>

        {/* Context Panel */}
        <div className="w-full md:w-64 flex flex-col gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4">WEARABLE VITALS</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Heart Rate</span>
                <span className="text-sm font-mono font-bold text-rose-400">{wearable?.heart_rate || '--'} bpm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">HRV</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{wearable?.hrv || '--'} ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Readiness</span>
                <span className="text-sm font-mono font-bold text-blue-400">{wearable?.readiness_score || '--'}/100</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex-1">
             <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2">TIMELINE</h3>
             <div className="text-3xl font-black font-mono text-white mt-4">
               {String(Math.floor(currentMs / 60000)).padStart(2, '0')}:
               {String(Math.floor((currentMs % 60000) / 1000)).padStart(2, '0')}.
               {String(Math.floor((currentMs % 1000) / 100)).padStart(1, '0')}
             </div>
          </div>
        </div>
      </div>

      {/* Playback Controls & Scrubber */}
      <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <button onClick={() => setCurrentMs(0)} className="text-slate-400 hover:text-white transition-colors">
          <SkipBack className="w-5 h-5" />
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
        </button>
        <button className="text-slate-400 hover:text-white transition-colors">
          <FastForward className="w-5 h-5" />
        </button>
        
        <input 
          type="range" 
          min={0} 
          max={maxMs} 
          value={currentMs} 
          onChange={handleSeek}
          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
        />
      </div>

      {/* Kinematic Charts */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-64 relative">
        <h3 className="absolute top-4 left-4 text-xs font-bold text-slate-400 tracking-wider z-10">JOINT KINEMATICS</h3>
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 30, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 12}} />
            <YAxis stroke="#64748b" tick={{fontSize: 12}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            
            {/* The playback cursor */}
            <ReferenceLine x={(currentMs / 1000).toFixed(1)} stroke="#3b82f6" strokeWidth={2} />
            
            {/* Anomaly markers on the timeline */}
            {anomalies.map((a, i) => (
              <ReferenceLine key={i} x={(a.timestamp_ms / 1000).toFixed(1)} stroke="#ef4444" strokeDasharray="4 4" />
            ))}

            <Line type="monotone" dataKey="leftKnee" stroke="#38bdf8" strokeWidth={2} dot={false} name="Left Knee Angle" />
            <Line type="monotone" dataKey="rightKnee" stroke="#818cf8" strokeWidth={2} dot={false} name="Right Knee Angle" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
