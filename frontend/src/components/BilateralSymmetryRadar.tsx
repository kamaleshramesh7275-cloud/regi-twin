import React from "react";
import { Activity, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";

export type JointSymmetryData = {
  jointName: string;
  leftAngle: number;
  rightAngle: number;
  leftVelocity: number; // deg/sec
  rightVelocity: number; // deg/sec
  unit: string;
};

interface Props {
  joints?: JointSymmetryData[];
  onSelectJoint?: (joint: JointSymmetryData) => void;
}

const DEFAULT_JOINTS: JointSymmetryData[] = [
  { jointName: "Hip Extension", leftAngle: 42, rightAngle: 48, leftVelocity: 110, rightVelocity: 135, unit: "deg" },
  { jointName: "Knee Flexion", leftAngle: 115, rightAngle: 128, leftVelocity: 210, rightVelocity: 260, unit: "deg" },
  { jointName: "Ankle Dorsiflexion", leftAngle: 18, rightAngle: 24, leftVelocity: 85, rightVelocity: 95, unit: "deg" },
  { jointName: "Valgus Deviation", leftAngle: 6.4, rightAngle: 2.1, leftVelocity: 142, rightVelocity: 45, unit: "deg" },
];

export function BilateralSymmetryRadar({ joints = DEFAULT_JOINTS, onSelectJoint }: Props) {
  // Calculate average asymmetry score
  const totalAsymmetry = joints.reduce((acc, curr) => {
    const diff = Math.abs(curr.leftAngle - curr.rightAngle);
    const maxVal = Math.max(curr.leftAngle, curr.rightAngle, 1);
    return acc + (diff / maxVal) * 100;
  }, 0);

  const avgAsymmetryPercent = Math.round(totalAsymmetry / joints.length);
  const isHighRisk = avgAsymmetryPercent > 15;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="pt-section-label text-slate-200">1. Bilateral Symmetry Radar &amp; Ghost Replay</span>
        </div>
        <div className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
          isHighRisk ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
        }`}>
          {avgAsymmetryPercent}% Limb Imbalance
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Real-time kinematic side-by-side comparison. Flags limb loading disparities that trigger compensatory overuse injuries.
      </p>

      {/* Joint Comparison Table */}
      <div className="space-y-3">
        {joints.map((j) => {
          const diff = Math.abs(j.leftAngle - j.rightAngle);
          const percent = Math.round((diff / Math.max(j.leftAngle, j.rightAngle, 1)) * 100);
          const isWarning = percent > 12;

          return (
            <div 
              key={j.jointName}
              onClick={() => onSelectJoint?.(j)}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-3 space-y-2 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{j.jointName}</span>
                <span className={`font-mono text-[11px] ${isWarning ? "text-amber-400" : "text-slate-400"}`}>
                  &Delta; {diff.toFixed(1)}{j.unit} ({percent}% diff)
                </span>
              </div>

              {/* Dual Progress Bar Comparison */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Left</span>
                    <span className="text-emerald-400 font-bold">{j.leftAngle}{j.unit}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all" 
                      style={{ width: `${Math.min(100, (j.leftAngle / 140) * 100)}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Right</span>
                    <span className="text-teal-400 font-bold">{j.rightAngle}{j.unit}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-400 h-full transition-all" 
                      style={{ width: `${Math.min(100, (j.rightAngle / 140) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isHighRisk && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Asymmetry threshold exceeded on <strong>Valgus Deviation</strong>. High risk of left knee compensatory loading.</span>
        </div>
      )}
    </div>
  );
}
