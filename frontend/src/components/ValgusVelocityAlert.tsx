import React from "react";
import { AlertTriangle, Zap, ShieldAlert } from "lucide-react";

interface Props {
  angularVelocityDegSec?: number;
  angularAccelDegSec2?: number;
}

export function ValgusVelocityAlert({ angularVelocityDegSec = 142, angularAccelDegSec2 = 820 }: Props) {
  const isDangerousVelocity = angularVelocityDegSec > 120;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="pt-section-label text-slate-200">4. Valgus Velocity &amp; Angular Acceleration</span>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
          isDangerousVelocity ? "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
        }`}>
          {isDangerousVelocity ? "High Velocity Collapse Risk" : "Safe Speed"}
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Measures the <em>speed</em> and <em>acceleration</em> of inward knee collapse — the primary predictor of non-contact ACL tears.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
          <div className="pt-section-label text-slate-400 mb-1">Angular Velocity</div>
          <div className={`font-mono text-xl font-bold ${angularVelocityDegSec > 120 ? "text-red-400" : "text-white"}`}>
            {angularVelocityDegSec} <span className="text-xs font-normal text-slate-400">°/s</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Threshold: &gt; 120°/s</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
          <div className="pt-section-label text-slate-400 mb-1">Angular Acceleration</div>
          <div className="font-mono text-xl font-bold text-white">
            {angularAccelDegSec2} <span className="text-xs font-normal text-slate-400">°/s²</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Rotational joint force</div>
        </div>
      </div>

      {isDangerousVelocity && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span><strong>ACL Risk Alert:</strong> Inward knee collapse velocity exceeded 120°/s on current rep. Engage hip abductors to stabilize knee tracking.</span>
        </div>
      )}
    </div>
  );
}
