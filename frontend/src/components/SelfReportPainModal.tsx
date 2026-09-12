import React, { useState } from "react";
import { X, Flame, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ZoneId } from "../HoloModel3D";
import { saveStoredSelfReportedPain } from "../lib/heatMapEngine";

interface SelfReportPainModalProps {
  zone: ZoneId | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SelfReportPainModal({ zone, onClose, onSaved }: SelfReportPainModalProps) {
  const [painLevel, setPainLevel] = useState<number>(6);
  const [painType, setPainType] = useState<string>("Aching");
  const [note, setNote] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  if (!zone) return null;

  const zoneLabel = zone.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const handleSave = () => {
    const intensity = painLevel / 10;
    const fullNote = `${painType} pain (${painLevel}/10). ${note}`.trim();
    saveStoredSelfReportedPain(zone, intensity, fullNote);
    setSubmitted(true);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 600);
  };

  const getSeverityBadge = (val: number) => {
    if (val >= 8) return { label: "Severe Pain", color: "bg-red-500/20 text-red-400 border-red-500/40" };
    if (val >= 5) return { label: "Moderate Pain", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" };
    if (val >= 1) return { label: "Mild Strain", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" };
    return { label: "No Pain", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" };
  };

  const badge = getSeverityBadge(painLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md anim-fade">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Log Self-Reported Pain</h2>
            <p className="text-xs text-slate-400">Target Region: <span className="text-cyan-400 font-bold">{zoneLabel}</span></p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div className="text-base font-bold text-emerald-300">Pain Logged to Digital Twin!</div>
            <p className="text-xs text-slate-400">Updating 3D continuous heat field map...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Pain Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300">Pain Rating (0–10)</label>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                  {painLevel}/10 · {badge.label}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                onChange={e => setPainLevel(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0 (None)</span>
                <span>5 (Moderate)</span>
                <span>10 (Worst)</span>
              </div>
            </div>

            {/* Pain Quality Options */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 block">Pain Quality</label>
              <div className="grid grid-cols-4 gap-2">
                {["Aching", "Sharp", "Stiff", "Throbbing"].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPainType(type)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      painType === type
                        ? "bg-amber-500/20 text-amber-300 border-amber-400 shadow-md shadow-amber-500/10"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Aggravated during leg press / morning stiffness"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Self-reported pain blends directly into the 3D continuous heat field map on your avatar.</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                Save to Digital Twin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
