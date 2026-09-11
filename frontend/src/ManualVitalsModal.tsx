import React, { useState } from "react";
import { XCircle, Edit3, HeartPulse, Moon, Footprints, Droplets, Activity, Save, Check } from "lucide-react";
import type { VitalReading, VitalType } from "./types/vitals";
import { saveVitalReading } from "./lib/healthConnect";
import { api } from "./api";

interface ManualVitalsModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: (reading: VitalReading) => void;
}

export default function ManualVitalsModal({ userId, onClose, onSuccess }: ManualVitalsModalProps) {
  const [metricType, setMetricType] = useState<VitalType>("heart_rate");
  const [value, setValue] = useState<number>(64);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const metricConfigs: Record<VitalType, { label: string; unit: string; min: number; max: number; step: number; icon: any; defaultVal: number; color: string }> = {
    heart_rate: { label: "Resting Heart Rate", unit: "bpm", min: 35, max: 200, step: 1, icon: HeartPulse, defaultVal: 62, color: "text-rose-500" },
    hrv: { label: "Heart Rate Variability (HRV)", unit: "ms", min: 10, max: 200, step: 1, icon: Activity, defaultVal: 68, color: "text-primary" },
    spo2: { label: "Blood Oxygen (SpO2)", unit: "%", min: 80, max: 100, step: 1, icon: Droplets, defaultVal: 98, color: "text-cyan-400" },
    sleep: { label: "Total Sleep Duration", unit: "hrs", min: 1, max: 16, step: 0.5, icon: Moon, defaultVal: 7.5, color: "text-indigo-400" },
    steps: { label: "Daily Step Count", unit: "steps", min: 100, max: 60000, step: 100, icon: Footprints, defaultVal: 8500, color: "text-emerald-400" },
    readiness: { label: "Subjective Readiness", unit: "/100", min: 0, max: 100, step: 1, icon: Activity, defaultVal: 85, color: "text-emerald-500" },
  };

  const handleTypeChange = (t: VitalType) => {
    setMetricType(t);
    setValue(metricConfigs[t].defaultVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const timestamp = new Date(`${date}T${time}:00`).toISOString();
      const config = metricConfigs[metricType];

      const reading: VitalReading = {
        id: `manual-${Date.now()}`,
        type: metricType,
        value: Number(value),
        unit: config.unit,
        timestamp,
        source: "manual",
        note: note.trim() || undefined,
      };

      // Save locally
      saveVitalReading(userId, reading);

      // Sync with backend
      const payload: any = { source: "manual" };
      if (metricType === "heart_rate") payload.heart_rate = Number(value);
      if (metricType === "hrv") payload.hrv = Number(value);
      if (metricType === "spo2") payload.spo2 = Number(value);
      if (metricType === "sleep") {
        payload.sleep_hours = Number(value);
        payload.sleep_score = Math.min(100, Math.round((Number(value) / 8) * 90));
      }
      if (metricType === "steps") payload.steps = Number(value);

      await api.syncWearableData(userId, payload).catch((err) => {
        console.warn("Backend sync notice:", err);
      });

      onSuccess(reading);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record manual vitals.");
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = metricConfigs[metricType];
  const Icon = currentConfig.icon;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Manual Vitals Check-in
              </h2>
              <p className="text-xs text-slate-400">
                Log hand-measured readings alongside your Realme Watch / Health Connect stream.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Metric Selector Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Select Vital Metric</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(metricConfigs) as VitalType[]).map((t) => {
                const cfg = metricConfigs[t];
                const TIcon = cfg.icon;
                const isSelected = metricType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/10"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <TIcon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : cfg.color}`} />
                    <span className="truncate">{cfg.label.split(" ")[0]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value Slider & Numeric Input */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${currentConfig.color}`} /> {currentConfig.label}
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min={currentConfig.min}
                  max={currentConfig.max}
                  step={currentConfig.step}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-base font-black text-white w-24 text-right focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-400 font-sans">{currentConfig.unit}</span>
              </div>
            </div>

            <input
              type="range"
              min={currentConfig.min}
              max={currentConfig.max}
              step={currentConfig.step}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Observation Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Measured before coffee, felt well-rested"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? "Recording..." : "Save Manual Reading"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
