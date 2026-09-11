/**
 * DATA OWNERSHIP MAPPING — BIOMECHANICAL STRAIN & ACWR SECTION
 * -----------------------------------------------------------------------------
 * Auth: Firebase Auth (userId = user.uid)
 * Data Store: FastAPI Backend + SQLite (physiotwin.db)
 * Endpoints:
 *   - GET /workouts/{userId}/stats  -> Computes acute volume, chronic weekly average, ACWR, cold_start, muscle strain
 *   - GET /analytics/injury-risk/{userId} -> Biomechanical injury risk & multi-factor weights
 *   - GET /wearables/latest/{userId} -> Autonomic readiness, HRV, sleep metrics
 *   - GET /pain/history/{userId}    -> Subjective pain overlay
 *
 * Reactivity: React Query caching with query key ['strain', userId].
 * -----------------------------------------------------------------------------
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export interface ContributingFactor {
  factor: string;
  contribution: number;
  value: string;
}

export interface InjuryRiskProfile {
  riskScore: number;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  recommendation: string;
  contributingFactors: ContributingFactor[];
}

export interface DailyLoadItem {
  date: string;
  dayName: string;
  volumeKg: number;
  setsCount?: number;
}

export interface MuscleStrainDistribution {
  Chest: number;
  Back: number;
  Shoulders: number;
  Arms: number;
  Quads: number;
  Hamstrings: number;
  Core: number;
}

export interface StrainBiometrics {
  acuteLoadKg: number;
  chronicLoadKg: number;
  acwr: number;
  isColdStart: boolean;
  totalWorkouts28d: number;
  readinessScore: number;
  acwrZone: {
    color: string;
    label: string;
    bg: string;
    text: string;
  };
  muscleStrain: MuscleStrainDistribution;
  radarData: { subject: string; A: number; fullMark: number }[];
  dailyBreakdown: DailyLoadItem[];
  injuryRisk: InjuryRiskProfile;
}

export const ACWR_ZONE_CONFIG = (val: number, isColdStart: boolean) => {
  if (isColdStart) {
    return {
      color: "#38bdf8",
      label: "Baseline Building (<4 workouts)",
      bg: "bg-sky-500/10 border-sky-500/30",
      text: "Gathering initial 28-day training load baseline",
    };
  }
  if (val > 1.5) {
    return {
      color: "#ef4444",
      label: "Overreach Danger (>1.5)",
      bg: "bg-red-500/10 border-red-500/30",
      text: "High spike in acute training load relative to baseline",
    };
  }
  if (val >= 1.3) {
    return {
      color: "#f59e0b",
      label: "Caution Zone (1.3–1.5)",
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "Approaching fatigue threshold; prioritize recovery",
    };
  }
  if (val >= 0.8) {
    return {
      color: "#10b981",
      label: "Optimal Sweet Spot (0.8–1.3)",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "Optimal progressive overload with low injury risk",
    };
  }
  return {
    color: "#38bdf8",
    label: "Under-training / Deload (<0.8)",
    bg: "bg-sky-500/10 border-sky-500/30",
    text: "Training stimulus below chronic capacity; safe for deload",
  };
};

export function useStrain(userId?: string | null) {
  const effectiveUserId = userId || "default_user";

  const query = useQuery<StrainBiometrics>({
    queryKey: ["strain", effectiveUserId],
    queryFn: async () => {
      if (!userId) {
        return createEmptyStrainState();
      }

      const [statsRes, riskRes, wearRes, painRes] = await Promise.all([
        api.getWorkoutStats(effectiveUserId).catch(() => null),
        api.getInjuryRisk(effectiveUserId).catch(() => null),
        api.getLatestWearable(effectiveUserId).catch(() => null),
        api.getPainHistory(effectiveUserId).catch(() => []),
      ]);

      const acuteLoadKg = statsRes?.acute_load || 0;
      const chronicLoadKg = statsRes?.chronic_load || 0;
      const totalWorkouts28d = statsRes?.total_workouts || 0;
      const isColdStart = statsRes?.is_cold_start !== undefined ? statsRes.is_cold_start : totalWorkouts28d < 4;
      const acwr = statsRes?.acwr !== undefined ? statsRes.acwr : (chronicLoadKg > 0 ? acuteLoadKg / chronicLoadKg : 1.0);

      const readinessScore = statsRes?.readiness_score || wearRes?.readiness_score || 85;
      const acwrZone = ACWR_ZONE_CONFIG(acwr, isColdStart);

      // Muscle Strain Radar
      const defaultMuscles: MuscleStrainDistribution = {
        Chest: 50,
        Back: 50,
        Shoulders: 50,
        Arms: 50,
        Quads: 50,
        Hamstrings: 50,
        Core: 45,
      };
      const muscleStrain: MuscleStrainDistribution = {
        ...defaultMuscles,
        ...(statsRes?.muscle_strain || {}),
      };

      const radarData = Object.entries(muscleStrain).map(([subject, A]) => ({
        subject,
        A: typeof A === "number" ? A : 50,
        fullMark: 100,
      }));

      // Daily Breakdown
      const dailyBreakdown: DailyLoadItem[] = (statsRes?.daily_breakdown || []).map((d: any) => ({
        date: d.date,
        dayName: d.day_name,
        volumeKg: d.volume_kg || 0,
        setsCount: d.sets_count || 0,
      }));

      // Injury Risk Profile
      const riskScore = riskRes?.risk_score !== undefined ? riskRes.risk_score : 8;
      const riskLevel = riskRes?.risk_level || (riskScore >= 50 ? "High" : riskScore >= 25 ? "Moderate" : "Low");
      const recommendation = riskRes?.recommendation || "Training load is balanced. Continue progressive overload safely.";

      const contributingFactors: ContributingFactor[] = riskRes?.contributing_factors || [
        {
          factor: "Workload Spike (ACWR)",
          contribution: acwr > 1.3 ? 15 : 0,
          value: `${acwr.toFixed(2)}x`,
        },
        {
          factor: "Subjective Pain",
          contribution: painRes && painRes.length > 0 ? (painRes[0]?.score || 0) * 2 : 0,
          value: painRes && painRes.length > 0 ? `${painRes[0]?.score || 0}/10` : "None",
        },
        { factor: "Bilateral Asymmetry", contribution: 5, value: "Optimal" },
        { factor: "Movement Fear (TSK)", contribution: 4, value: "Baseline" },
        {
          factor: "Sleep & Autonomic",
          contribution: wearRes?.sleep_hours && wearRes.sleep_hours < 6 ? 10 : 0,
          value: wearRes?.sleep_hours ? `${wearRes.sleep_hours}h` : "7.5h",
        },
      ];

      return {
        acuteLoadKg,
        chronicLoadKg,
        acwr,
        isColdStart,
        totalWorkouts28d,
        readinessScore,
        acwrZone,
        muscleStrain,
        radarData,
        dailyBreakdown,
        injuryRisk: {
          riskScore,
          riskLevel,
          recommendation,
          contributingFactors,
        },
      };
    },
    enabled: !!effectiveUserId,
  });

  return {
    ...query,
    strain: query.data || createEmptyStrainState(),
    isEmpty: !query.isLoading && (query.data?.totalWorkouts28d || 0) === 0,
  };
}

function createEmptyStrainState(): StrainBiometrics {
  const acwrZone = ACWR_ZONE_CONFIG(0, true);
  return {
    acuteLoadKg: 0,
    chronicLoadKg: 0,
    acwr: 0,
    isColdStart: true,
    totalWorkouts28d: 0,
    readinessScore: 85,
    acwrZone,
    muscleStrain: {
      Chest: 40,
      Back: 40,
      Shoulders: 40,
      Arms: 40,
      Quads: 40,
      Hamstrings: 40,
      Core: 40,
    },
    radarData: [
      { subject: "Chest", A: 40, fullMark: 100 },
      { subject: "Back", A: 40, fullMark: 100 },
      { subject: "Shoulders", A: 40, fullMark: 100 },
      { subject: "Arms", A: 40, fullMark: 100 },
      { subject: "Quads", A: 40, fullMark: 100 },
      { subject: "Hamstrings", A: 40, fullMark: 100 },
      { subject: "Core", A: 40, fullMark: 100 },
    ],
    dailyBreakdown: [],
    injuryRisk: {
      riskScore: 5,
      riskLevel: "Low",
      recommendation: "Log your first workout to establish your acute-to-chronic training load ratio.",
      contributingFactors: [
        { factor: "Workload Spike (ACWR)", contribution: 0, value: "Baseline" },
        { factor: "Subjective Pain", contribution: 0, value: "None" },
        { factor: "Bilateral Asymmetry", contribution: 0, value: "Optimal" },
        { factor: "Movement Fear (TSK)", contribution: 0, value: "Baseline" },
        { factor: "Sleep & Autonomic", contribution: 0, value: "7.5h" },
      ],
    },
  };
}
