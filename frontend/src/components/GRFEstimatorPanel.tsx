import React from "react";
import { Zap, ArrowUpRight, Scale } from "lucide-react";

interface Props {
  userWeightKg?: number;
  peakAccelerationY?: number; // m/s^2
}

export function GRFEstimatorPanel({ userWeightKg = 74, peakAccelerationY = 18.2 }: Props) {
  // F = m * (g + a_y)
  const g = 9.81;
  const totalAcc = g + peakAccelerationY;
  const forceNewtons = Math.round(userWeightKg * totalAcc);
  const bwMultiple = parseFloat((totalAcc / g).toFixed(2));

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="pt-section-label text-slate-200">2. Ground Reaction Force (GRF) Estimator</span>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Camera-Derived Force
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Estimates vertical ground reaction force ($F_v = m \cdot (g + a_y)$) directly from camera landmark acceleration without physical force plates.
      </p>

      {/* Force Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
          <div className="pt-section-label text-slate-400 mb-1">Peak Vertical Force</div>
          <div className="font-mono text-xl font-bold text-white">
            {forceNewtons} <span className="text-xs font-normal text-slate-400">N</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Impact load at landing</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
          <div className="pt-section-label text-slate-400 mb-1">Bodyweight Multiple</div>
          <div className={`font-mono text-xl font-bold ${bwMultiple > 2.5 ? "text-amber-400" : "text-emerald-400"}`}>
            {bwMultiple}x <span className="text-xs font-normal text-slate-400">BW</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Relative joint load</div>
        </div>
      </div>

      {/* Real-time Acceleration Bar */}
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-slate-400">Vertical Acceleration ($a_y$)</span>
          <span className="text-emerald-400 font-bold">{peakAccelerationY.toFixed(1)} m/s²</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${Math.min(100, (peakAccelerationY / 30) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
