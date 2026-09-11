import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext";
import type { MetricTrendItem } from "../components/PredictiveTrendsView";
import type { ZoneId } from "../HoloModel3D";

// ── Metric → Zone anchor mapping ─────────────────────────────────────────────
// Only metrics with a genuinely defensible anatomical anchor are included.
// Systemic values (glucose, cholesterol, haemoglobin, etc.) are intentionally
// left out of this map so they stay in the systemic panel.
const METRIC_TO_ZONE: Record<string, ZoneId> = {
  // Kidney function → lumbar/flank region
  creatinine:                "lumbar",
  creatinine_serum:          "lumbar",
  bun:                       "lumbar",
  blood_urea_nitrogen:       "lumbar",

  // Liver enzymes → lumbar (right upper quadrant approximation)
  alt:                       "lumbar",
  alanine_aminotransferase:  "lumbar",
  ast:                       "lumbar",
  aspartate_aminotransferase: "lumbar",
  ggt:                       "lumbar",
  gamma_gt:                  "lumbar",
  alkaline_phosphatase:      "lumbar",
  alp:                       "lumbar",

  // Gout / joint inflammation → knee (most common presentation site)
  uric_acid:                 "left_knee",
  urate:                     "left_knee",

  // Systemic inflammation → chest (nearest general anchor)
  crp:                       "chest",
  c_reactive_protein:        "chest",
  hscrp:                     "chest",

  // Bone / joint density scans
  bone_density:              "lumbar",
  bone_mineral_density:      "lumbar",
  bmd:                       "lumbar",
  t_score:                   "lumbar",
  z_score:                   "lumbar",
};

// Normalise metric keys (strip spaces/dashes for fuzzy matching)
function normaliseKey(k: string) {
  return k.toLowerCase().replace(/[\s\-]/g, "_");
}

export function getZoneForMetric(metricKey: string): ZoneId | null {
  const norm = normaliseKey(metricKey);
  return METRIC_TO_ZONE[norm] ?? null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GroupedRegionalInsight {
  zone: ZoneId;
  metrics: MetricTrendItem[];
  hasFlagged: boolean; // true if any metric in the group is flagged/anomalous
}

interface ClinicInsightsState {
  regionalInsights: GroupedRegionalInsight[];
  systemicInsights: MetricTrendItem[];
  allMetrics: MetricTrendItem[];
  isLoading: boolean;
  refresh: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ClinicInsightsContext = createContext<ClinicInsightsState>({
  regionalInsights: [],
  systemicInsights: [],
  allMetrics: [],
  isLoading: false,
  refresh: () => {},
});

export function ClinicInsightsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.uid || "demo_user";

  const [allMetrics, setAllMetrics] = useState<MetricTrendItem[]>([]);
  const [isLoading, setIsLoading]   = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getClinicMetricTrends(userId);
      setAllMetrics(data?.metrics || []);
    } catch {
      // Silently degrade — mesh renders without markers
      setAllMetrics([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ── Classify metrics ──────────────────────────────────────────────────────
  const regionalMap = new Map<ZoneId, MetricTrendItem[]>();
  const systemicInsights: MetricTrendItem[] = [];

  for (const metric of allMetrics) {
    // Only surface metrics that have at least one confirmed data point
    if (!metric.latest_value && metric.history.length === 0) continue;

    const zone = getZoneForMetric(metric.metric_key);
    if (zone) {
      const existing = regionalMap.get(zone) ?? [];
      regionalMap.set(zone, [...existing, metric]);
    } else {
      systemicInsights.push(metric);
    }
  }

  const regionalInsights: GroupedRegionalInsight[] = Array.from(regionalMap.entries()).map(
    ([zone, metrics]) => ({
      zone,
      metrics,
      hasFlagged: metrics.some(
        (m) => m.latest_status === "high" || m.latest_status === "low" || m.latest_status === "flagged"
      ),
    })
  );

  return (
    <ClinicInsightsContext.Provider
      value={{ regionalInsights, systemicInsights, allMetrics, isLoading, refresh: load }}
    >
      {children}
    </ClinicInsightsContext.Provider>
  );
}

export function useClinicInsights() {
  return useContext(ClinicInsightsContext);
}
