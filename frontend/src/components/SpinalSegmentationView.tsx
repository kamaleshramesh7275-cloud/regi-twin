import React from "react";
import { Activity, ShieldAlert, CheckCircle2 } from "lucide-react";

export type SpinalSegmentData = {
  region: "Cervical (Neck)" | "Thoracic (Upper Back)" | "Lumbar (Lower Back)";
  currentAngle: number;
  optimalRange: string;
  status: "Optimal" | "Watch" | "Warning";
  description: string;
};

const DEFAULT_SEGMENTS: SpinalSegmentData[] = [
  { region: "Cervical (Neck)", currentAngle: 14, optimalRange: "0° - 15°", status: "Optimal", description: "Minimal forward head shift detected." },
  { region: "Thoracic (Upper Back)", currentAngle: 38, optimalRange: "20° - 40°", status: "Watch", description: "Slight upper kyphotic curvature under load." },
  { region: "Lumbar (Lower Back)", currentAngle: 28, optimalRange: "15° - 25°", status: "Warning", description: "Lumbar flexion deviation exceeding safe threshold." },
];

export function SpinalSegmentationView() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="pt-section-label text-slate-200">3. Spinal Segmental Segmenting</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          3-Zone Articulation
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Breaks the spinal column into 3 distinct anatomical regions (Cervical, Thoracic, Lumbar) to pinpoint specific disc stress.
      </p>

      <div className="space-y-3">
        {DEFAULT_SEGMENTS.map((s) => {
          const isWarn = s.status === "Warning";
          const isWatch = s.status === "Watch";

          return (
            <div key={s.region} className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{s.region}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  isWarn ? "bg-red-500/15 text-red-400 border-red-500/30" : isWatch ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                }`}>
                  {s.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Current Angle: <strong className="text-white">{s.currentAngle}°</strong></span>
                <span>Optimal: {s.optimalRange}</span>
              </div>

              <p className="text-[11px] text-slate-500">{s.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
