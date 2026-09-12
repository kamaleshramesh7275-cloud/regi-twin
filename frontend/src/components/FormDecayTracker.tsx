import React from "react";
import { TrendingDown, Activity, AlertCircle } from "lucide-react";

export type RepDecayData = {
  repNumber: number;
  symmetryScore: number; // 0-100
  valgusAngle: number;   // deg
  repTempoSec: number;
};

const DEFAULT_REPS: RepDecayData[] = [
  { repNumber: 1, symmetryScore: 94, valgusAngle: 2.1, repTempoSec: 1.8 },
  { repNumber: 2, symmetryScore: 92, valgusAngle: 2.4, repTempoSec: 1.9 },
  { repNumber: 3, symmetryScore: 90, valgusAngle: 2.8, repTempoSec: 2.0 },
  { repNumber: 4, symmetryScore: 88, valgusAngle: 3.2, repTempoSec: 2.1 },
  { repNumber: 5, symmetryScore: 85, valgusAngle: 4.1, repTempoSec: 2.3 },
  { repNumber: 6, symmetryScore: 81, valgusAngle: 5.0, repTempoSec: 2.5 },
  { repNumber: 7, symmetryScore: 74, valgusAngle: 6.8, repTempoSec: 2.9 },
  { repNumber: 8, symmetryScore: 65, valgusAngle: 8.5, repTempoSec: 3.4 },
];

export function FormDecayTracker({ reps = DEFAULT_REPS }: { reps?: RepDecayData[] }) {
  const breakdownRep = reps.find(r => r.symmetryScore < 75) || reps[reps.length - 1];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-400" />
          <span className="pt-section-label text-slate-200">5. Fatigue-Induced Form Decay Tracker</span>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
          Breakdown on Rep {breakdownRep.repNumber}
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Tracks rep-by-rep stability decay across multi-rep sets to pinpoint exact neuromuscular fatigue thresholds.
      </p>

      {/* Rep-by-Rep Decay Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {reps.map((r) => {
          const isFailing = r.symmetryScore < 75;

          return (
            <div 
              key={r.repNumber} 
              className={`p-2 rounded-lg text-center border font-mono transition-all ${
                isFailing ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-slate-950 border-slate-800 text-slate-300"
              }`}
            >
              <div className="text-[10px] text-slate-500 font-sans">Rep {r.repNumber}</div>
              <div className="text-xs font-bold mt-0.5">{r.symmetryScore}%</div>
              <div className="text-[9px] text-slate-400">{r.valgusAngle}°</div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs text-slate-300">
        <span>Form Decay Limit:</span>
        <span className="font-mono text-amber-400 font-bold">
          Recommended Set Stop at Rep {breakdownRep.repNumber - 1}
        </span>
      </div>
    </div>
  );
}
