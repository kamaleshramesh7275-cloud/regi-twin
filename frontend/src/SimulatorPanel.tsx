import { useState } from "react";
import { Play, Target } from "lucide-react";
import { api } from "./api";
import { auth } from "./firebase";

export default function SimulatorPanel({ 
  currentReserve, 
  currentRecovery,
  onSimulate
}: { 
  currentReserve: number, 
  currentRecovery: number,
  onSimulate?: (data: { reserve: number, recovery: number } | null) => void
}) {
  const [activity, setActivity] = useState("Running");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState("Moderate");
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    let simResult;
    try {
      const uid = auth.currentUser?.uid || "test-user";
      const res = await api.simulateActivity(uid, {
        activity_type: activity,
        duration_mins: duration,
        intensity
      });
      simResult = res;
    } catch (e) {
      console.error(e);
      // Fallback if no network
      const cost = duration * 0.8;
      simResult = {
        original: { reserve: currentReserve, recovery: currentRecovery },
        simulated: { 
          reserve: Math.max(0, currentReserve - cost),
          recovery: Math.max(0, currentRecovery - (cost * 0.5))
        },
        cost
      };
    }
    setResult(simResult);
    if (onSimulate) {
      onSimulate(simResult.simulated);
    }
    setLoading(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <div>
          <div className="text-sm font-bold">What-If Simulator</div>
          <div className="text-xs text-muted-foreground">Test activities against your twin</div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">Activity</label>
            <select 
              value={activity}
              onChange={e => setActivity(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg p-2 text-xs focus:outline-none"
            >
              <option>Running</option>
              <option>Weightlifting</option>
              <option>Yoga</option>
              <option>Cycling</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">Intensity</label>
            <select 
              value={intensity}
              onChange={e => setIntensity(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg p-2 text-xs focus:outline-none"
            >
              <option>Light</option>
              <option>Moderate</option>
              <option>Hard</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Duration</label>
            <span className="text-xs font-mono-numbers">{duration} mins</span>
          </div>
          <input 
            type="range" 
            min="5" max="120" step="5"
            value={duration}
            onChange={e => setDuration(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <button 
          onClick={handleSimulate}
          disabled={loading}
          className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
          Run Simulation
        </button>

        {/* Results */}
        {result && (
          <div className="mt-4 pt-4 border-t border-border animate-fade-in space-y-3">
            <div className="text-xs font-semibold text-center mb-2">Projected Impact</div>
            
            <div>
              <div className="flex justify-between text-[10px] uppercase text-muted-foreground font-bold mb-1">
                <span>Reserve Drop</span>
                <span className="text-red-400">-{result.cost.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono-numbers">
                <span className="text-muted-foreground line-through">{result.original.reserve.toFixed(1)}%</span>
                <span>→</span>
                <span className="font-bold">{result.simulated.reserve.toFixed(1)}%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] uppercase text-muted-foreground font-bold mb-1">
                <span>Recovery Score</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono-numbers">
                <span className="text-muted-foreground line-through">{result.original.recovery.toFixed(1)}%</span>
                <span>→</span>
                <span className={`font-bold ${result.simulated.recovery < 50 ? 'text-red-400' : 'text-amber-400'}`}>
                  {result.simulated.recovery.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {result.simulated.reserve < 20 && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-500 font-medium">
                ⚠️ Warning: This activity will deeply deplete your capability reserve. High injury risk.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
