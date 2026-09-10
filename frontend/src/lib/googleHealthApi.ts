import type { ZoneRisk } from "../HoloModel3D";

/**
 * Health Connect Exercise Types mapped to PhysioTwin biomechanical joint zones and strain load levels.
 */
export const HEALTH_CONNECT_EXERCISE_TYPES: Record<string, { name: string; load: string; affectedZones: string[] }> = {
  EXERCISE_TYPE_STRENGTH_TRAINING: {
    name: "Strength Training",
    load: "High",
    affectedZones: ["lumbar", "left_knee", "right_knee", "left_shoulder", "right_shoulder", "left_thigh", "right_thigh"]
  },
  EXERCISE_TYPE_WEIGHTLIFTING: {
    name: "Weightlifting",
    load: "High",
    affectedZones: ["lumbar", "left_knee", "right_knee", "left_shoulder", "right_shoulder"]
  },
  EXERCISE_TYPE_RUNNING: {
    name: "Running",
    load: "High",
    affectedZones: ["left_knee", "right_knee", "left_ankle", "right_ankle", "lumbar"]
  },
  EXERCISE_TYPE_RUNNING_TREADMILL: {
    name: "Treadmill Running",
    load: "High",
    affectedZones: ["left_knee", "right_knee", "left_ankle", "right_ankle"]
  },
  EXERCISE_TYPE_BIKING: {
    name: "Cycling",
    load: "Medium",
    affectedZones: ["left_knee", "right_knee", "left_thigh", "right_thigh"]
  },
  EXERCISE_TYPE_BIKING_STATIONARY: {
    name: "Stationary Bike",
    load: "Medium",
    affectedZones: ["left_knee", "right_knee", "left_thigh", "right_thigh"]
  },
  EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING: {
    name: "HIIT Workout",
    load: "High",
    affectedZones: ["left_knee", "right_knee", "lumbar", "left_shoulder", "right_shoulder"]
  },
  EXERCISE_TYPE_CALISTHENICS: {
    name: "Calisthenics / Bodyweight",
    load: "Medium",
    affectedZones: ["left_shoulder", "right_shoulder", "core", "thoracic"]
  },
  EXERCISE_TYPE_YOGA: {
    name: "Yoga & Mobility",
    load: "Low",
    affectedZones: ["thoracic", "lumbar", "left_shoulder", "right_shoulder"]
  },
  EXERCISE_TYPE_PILATES: {
    name: "Pilates",
    load: "Low",
    affectedZones: ["lumbar", "thoracic", "core"]
  },
  EXERCISE_TYPE_ROWING_MACHINE: {
    name: "Rowing",
    load: "Medium",
    affectedZones: ["lumbar", "thoracic", "left_shoulder", "right_shoulder"]
  },
  EXERCISE_TYPE_SWIMMING_POOL: {
    name: "Swimming",
    load: "Medium",
    affectedZones: ["left_shoulder", "right_shoulder", "thoracic"]
  },
  EXERCISE_TYPE_WALKING: {
    name: "Walking",
    load: "Low",
    affectedZones: ["left_ankle", "right_ankle"]
  }
};

export const MEAL_TYPES: Record<number | string, string> = {
  1: "Breakfast",
  2: "Lunch",
  3: "Dinner",
  4: "Snack",
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
  UNKNOWN: "Meal"
};

export interface HealthConnectNutritionRecord {
  energy?: { inKilocalories?: number; inJoules?: number } | number;
  protein?: { inGrams?: number } | number;
  totalCarbohydrate?: { inGrams?: number } | number;
  totalFat?: { inGrams?: number } | number;
  dietaryFiber?: { inGrams?: number } | number;
  sodium?: { inMilligrams?: number } | number;
  mealType?: number | string;
  name?: string;
  startTime: string;
  endTime?: string;
}

export interface HealthConnectExerciseRecord {
  exerciseType: string | number;
  title?: string;
  notes?: string;
  startTime: string;
  endTime: string;
  segments?: Array<{
    startTime: string;
    endTime: string;
    segmentType?: number | string;
    repetitionsCount?: number;
    weight?: { inKilograms?: number } | number;
  }>;
}

export interface HealthConnectPayload {
  nutritionRecords?: HealthConnectNutritionRecord[];
  exerciseSessionRecords?: HealthConnectExerciseRecord[];
  heartRateRecords?: any[];
  stepsRecords?: any[];
}

/**
 * Normalizes raw Health Connect data into PhysioTwin timeline models
 */
export function normalizeHealthConnectData(payload: HealthConnectPayload) {
  const nutritionMap: Record<string, {
    date: string;
    day: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
    fiber: number;
    meals: any[];
  }> = {};

  // Process Nutrition Records
  const nutritionRecords = payload.nutritionRecords || [];
  for (const record of nutritionRecords) {
    if (!record.startTime) continue;
    const dateObj = new Date(record.startTime);
    const isoDate = dateObj.toISOString().split("T")[0];
    const dayStr = dateObj.toLocaleDateString("en-US", { weekday: "short" });

    if (!nutritionMap[isoDate]) {
      nutritionMap[isoDate] = {
        date: isoDate,
        day: dayStr,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sodium: 0,
        fiber: 0,
        meals: []
      };
    }

    const cals = typeof record.energy === "object" ? record.energy?.inKilocalories || 0 : (typeof record.energy === "number" ? record.energy : 0);
    const protein = typeof record.protein === "object" ? record.protein?.inGrams || 0 : (typeof record.protein === "number" ? record.protein : 0);
    const carbs = typeof record.totalCarbohydrate === "object" ? record.totalCarbohydrate?.inGrams || 0 : (typeof record.totalCarbohydrate === "number" ? record.totalCarbohydrate : 0);
    const fat = typeof record.totalFat === "object" ? record.totalFat?.inGrams || 0 : (typeof record.totalFat === "number" ? record.totalFat : 0);
    const sodium = typeof record.sodium === "object" ? record.sodium?.inMilligrams || 0 : (typeof record.sodium === "number" ? record.sodium : 0);
    const fiber = typeof record.dietaryFiber === "object" ? record.dietaryFiber?.inGrams || 0 : (typeof record.dietaryFiber === "number" ? record.dietaryFiber : 0);

    nutritionMap[isoDate].calories += Math.round(cals);
    nutritionMap[isoDate].protein += Math.round(protein);
    nutritionMap[isoDate].carbs += Math.round(carbs);
    nutritionMap[isoDate].fat += Math.round(fat);
    nutritionMap[isoDate].sodium += Math.round(sodium);
    nutritionMap[isoDate].fiber += Math.round(fiber);

    const mealLabel = record.name || MEAL_TYPES[record.mealType ?? "UNKNOWN"] || "Meal";
    nutritionMap[isoDate].meals.push({
      meal: mealLabel,
      time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      calories: Math.round(cals),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat)
    });
  }

  const nutritionHistory = Object.values(nutritionMap).sort((a, b) => a.date.localeCompare(b.date));

  // Process Exercise Sessions
  const workouts: any[] = [];
  const exerciseRecords = payload.exerciseSessionRecords || [];

  for (const session of exerciseRecords) {
    if (!session.startTime) continue;
    const dateObj = new Date(session.startTime);
    const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const isoDate = dateObj.toISOString().split("T")[0];

    let durationMin = 30;
    if (session.endTime) {
      const ms = new Date(session.endTime).getTime() - dateObj.getTime();
      durationMin = Math.max(1, Math.round(ms / (60 * 1000)));
    }

    const typeKey = String(session.exerciseType);
    const meta = HEALTH_CONNECT_EXERCISE_TYPES[typeKey] || {
      name: session.title || "Exercise Session",
      load: durationMin >= 45 ? "High" : durationMin >= 20 ? "Medium" : "Low",
      affectedZones: ["lumbar", "left_knee", "right_knee"]
    };

    // Parse sets / reps segments if present
    const exercises: any[] = [];
    let volumeKg = 0;
    if (session.segments && session.segments.length > 0) {
      for (const seg of session.segments) {
        const reps = seg.repetitionsCount || 10;
        const weight = typeof seg.weight === "object" ? seg.weight?.inKilograms || 0 : (typeof seg.weight === "number" ? seg.weight : 0);
        volumeKg += reps * weight;
        exercises.push({
          name: meta.name,
          sets: 1,
          reps,
          weight_kg: weight
        });
      }
    } else {
      volumeKg = durationMin * 80; // Estimated load volume
    }

    workouts.push({
      app: "Google Health Connect",
      name: session.title || meta.name,
      load: meta.load,
      duration_min: durationMin,
      volume_kg: Math.round(volumeKg),
      affectedZones: meta.affectedZones,
      day: dateStr,
      date: isoDate,
      timestamp: session.startTime,
      exercises
    });
  }

  const validDays = nutritionHistory.filter(n => n.calories > 0);
  const avgProtein = validDays.length > 0 ? Math.round(validDays.reduce((s, n) => s + n.protein, 0) / validDays.length) : 0;
  const avgCals = validDays.length > 0 ? Math.round(validDays.reduce((s, n) => s + n.calories, 0) / validDays.length) : 0;

  return {
    source: "Google Health Connect",
    workouts,
    nutrition: nutritionHistory,
    weeklySummary: validDays.length > 0 ? {
      avg_protein_g: avgProtein,
      avg_calories: avgCals,
      tracked_days: validDays.length
    } : null
  };
}

import { api } from "../api";

export async function fetchGoogleHealthData(userId: string) {
  try {
    const [res, weeklyNutrition, manualWorkouts] = await Promise.all([
      api.getExternalApps(userId).catch(() => []),
      api.getWeeklyNutrition(userId).catch(() => null),
      api.getWorkouts(userId, 20).catch(() => [])
    ]);

    let workouts: any[] = [];
    let nutritionHistory: any[] = [];
    let weeklySummary: any = null;

    // 1. Process Google Health / Hevy sessions
    for (const session of res) {
      const data = session.session_data;
      if (data?.activities) {
        workouts = workouts.concat(data.activities.map((act: any) => ({
          name: act.name,
          load: act.intensity_zone?.includes("High") || (act.load_score && act.load_score > 50) ? "High" : "Medium",
          load_score: act.load_score,
          duration_min: act.duration_minutes || act.duration_min || 30,
          avg_heart_rate: act.avg_heart_rate,
          muscle_target: act.muscle_target || []
        })));
      }
      if (data?.workouts) {
        workouts = workouts.concat(data.workouts);
      }
      if (data?.nutrition) {
        nutritionHistory = nutritionHistory.concat(data.nutrition);
      }
      if (data?.weekly_summary) {
        weeklySummary = data.weekly_summary;
      }
    }

    // 2. Include manual workouts if present
    if (manualWorkouts && manualWorkouts.length > 0) {
      workouts = workouts.concat(manualWorkouts.map((mw: any) => ({
        name: mw.name,
        load: mw.load_level || "Medium",
        volume_kg: mw.volume_kg || 3000,
        exercises: mw.exercises || [],
        duration_min: mw.duration_min || 45
      })));
    }

    // 3. Include Nutritionix weekly rollup if available
    if (weeklyNutrition?.nutrition && weeklyNutrition.nutrition.length > 0) {
      const activeDays = weeklyNutrition.nutrition.filter((d: any) => d.calories > 0 || d.protein > 0);
      if (activeDays.length > 0) {
        nutritionHistory = activeDays;
        weeklySummary = weeklyNutrition.weekly_summary;
      }
    }

    return {
      source: "Live Activity & Nutrition Engine (Google Health API + Nutritionix)",
      workouts,
      nutrition: nutritionHistory,
      weeklySummary
    };

  } catch (error) {
    console.error("Failed to fetch fit/nutrition data for dynamic twin:", error);
    throw error;
  }
}

/**
 * Calculates dynamic joint risk adjustments based on Google Health Connect workload and recovery
 */
export function calculateDynamicRisk(
  baseRisk: ZoneRisk,
  healthData: ReturnType<typeof normalizeHealthConnectData>
): ZoneRisk {
  const updatedRisk = { ...baseRisk };

  const hasHighLoad = healthData.workouts.some(w => w.load === "High");
  const hasLowProtein = healthData.nutrition.some(n => n.protein > 0 && n.protein < 120);

  if (hasHighLoad && hasLowProtein) {
    updatedRisk.lumbar = Math.min(100, (updatedRisk.lumbar || 0) + 30);
    updatedRisk.left_knee = Math.min(100, (updatedRisk.left_knee || 0) + 25);
    updatedRisk.right_knee = Math.min(100, (updatedRisk.right_knee || 0) + 25);
  }

  return updatedRisk;
}
