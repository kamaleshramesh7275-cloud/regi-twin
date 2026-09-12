export interface CaptureInsightRecord {
  id: string;
  timestamp: string;
  exerciseType: string;
  durationSec: number;
  // Kinematic Metrics
  peakValgusAngle: number;
  valgusVelocity: number;
  lumbarFlexionAngle: number;
  bilateralSymmetryPercent: number;
  grfPeakBW: number;
  formDecayBreakdownRep: number;
  // AI Insight & Prescriptions
  llmSummary: string;
  recommendedDrills: string[];
}

const STORAGE_KEY = "physiotwin_capture_insights_history";
const DEFAULT_HISTORY: CaptureInsightRecord[] = [];

export const captureHistoryStore = {
  getHistory(userId?: string): CaptureInsightRecord[] {
    const key = userId ? `physiotwin_capture_insights_history_${userId}` : STORAGE_KEY;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addInsight(record: Omit<CaptureInsightRecord, "id" | "timestamp">, userId?: string): CaptureInsightRecord {
    const current = this.getHistory(userId);
    const newRecord: CaptureInsightRecord = {
      ...record,
      id: `cap-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    const updated = [newRecord, ...current];
    const key = userId ? `physiotwin_capture_insights_history_${userId}` : STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist capture insight:", e);
    }
    return newRecord;
  },

  getLatest(): CaptureInsightRecord | null {
    const history = this.getHistory();
    return history.length ? history[0] : null;
  }
};
