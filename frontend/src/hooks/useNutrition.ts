/**
 * DATA OWNERSHIP MAPPING — NUTRITION SECTION
 * -----------------------------------------------------------------------------
 * Auth: Firebase Auth (userId = user.uid)
 * Data Store: FastAPI Backend + SQLite (physiotwin.db)
 * Endpoints:
 *   - GET  /nutrition/daily/{userId}?date={date}
 *   - GET  /nutrition/week/{userId}
 *   - POST /nutrition/log/{userId}
 *   - POST /nutrition/log/{logId}/image
 *   - DELETE /nutrition/{logId}
 *   - POST /nutrition/water/{userId}
 *   - GET  /nutrition/water/{userId}
 *   - POST /nutrition/weight/{userId}
 *   - GET  /nutrition/weight/{userId}
 *   - POST /nutrition/seed-week/{userId}
 *
 * Reactivity: React Query caching with instant queryClient invalidation on all mutations.
 * -----------------------------------------------------------------------------
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export interface LoggedMealItem {
  food_id?: string;
  name: string;
  portion_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micros?: Record<string, number>;
}

export interface MealLogEntry {
  id: string;
  meal_type: string;
  meal_name?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: LoggedMealItem[];
  image_url?: string;
  created_at?: string;
}

export interface DailyNutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  micros: Record<string, number>;
}

export interface DailyNutritionData {
  date: string;
  totals: DailyNutritionTotals;
  meals: MealLogEntry[];
  water_ml: number;
}

export interface UserNutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

export const DEFAULT_NUTRITION_TARGETS: UserNutritionTargets = {
  calories: 2400,
  protein: 150,
  carbs: 250,
  fat: 65,
  water: 3000,
};

export function useTodayNutrition(userId?: string | null, date?: string) {
  const queryClient = useQueryClient();
  const effectiveUserId = userId || "default_user";

  const queryKey = ["nutrition", "daily", effectiveUserId, date || "today"];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<DailyNutritionData>({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return {
          date: date || new Date().toISOString().split("T")[0],
          totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0, micros: {} },
          meals: [],
          water_ml: 0,
        };
      }
      return await api.getDailyNutrition(effectiveUserId, date);
    },
    enabled: !!effectiveUserId,
  });

  // Log Meal Mutation with automatic cache invalidation
  const logMealMutation = useMutation({
    mutationFn: async ({
      mealType,
      items,
      photo,
    }: {
      mealType: string;
      items: LoggedMealItem[];
      photo?: File | null;
    }) => {
      const res = await api.logNutrition(effectiveUserId, {
        meal_type: mealType,
        items,
      });
      if (photo && res?.id) {
        await api.uploadMealImage(res.id, photo);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition", "daily", effectiveUserId] });
      queryClient.invalidateQueries({ queryKey: ["nutrition", "weekly", effectiveUserId] });
    },
  });

  // Delete Meal Mutation
  const deleteMealMutation = useMutation({
    mutationFn: async (logId: string) => {
      return await api.deleteNutritionLog(logId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition", "daily", effectiveUserId] });
      queryClient.invalidateQueries({ queryKey: ["nutrition", "weekly", effectiveUserId] });
    },
  });

  // Water Log Mutation
  const logWaterMutation = useMutation({
    mutationFn: async (amountMl: number) => {
      return await api.logWater(effectiveUserId, amountMl, date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition", "daily", effectiveUserId] });
    },
  });

  // Seed Demo Week Mutation
  const seedWeekMutation = useMutation({
    mutationFn: async () => {
      return await api.seedNutritionWeek(effectiveUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition", "daily", effectiveUserId] });
      queryClient.invalidateQueries({ queryKey: ["nutrition", "weekly", effectiveUserId] });
    },
  });

  const totals = data?.totals || {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    water_ml: 0,
    micros: {},
  };
  const meals = data?.meals || [];
  const waterMl = data?.water_ml || totals.water_ml || 0;
  const isEmpty = !isLoading && meals.length === 0;

  return {
    data,
    totals,
    meals,
    waterMl,
    isLoading,
    isFetching,
    isError,
    error,
    isEmpty,
    refetch,
    logMeal: logMealMutation.mutateAsync,
    isLoggingMeal: logMealMutation.isPending,
    deleteMeal: deleteMealMutation.mutateAsync,
    isDeletingMeal: deleteMealMutation.isPending,
    logWater: logWaterMutation.mutateAsync,
    isLoggingWater: logWaterMutation.isPending,
    seedWeek: seedWeekMutation.mutateAsync,
    isSeeding: seedWeekMutation.isPending,
  };
}

export function useWeeklyNutrition(userId?: string | null) {
  const effectiveUserId = userId || "default_user";

  return useQuery({
    queryKey: ["nutrition", "weekly", effectiveUserId],
    queryFn: async () => {
      if (!userId) return { nutrition: [] };
      return await api.getWeeklyNutrition(effectiveUserId);
    },
    enabled: !!effectiveUserId,
  });
}

export function useWeightHistory(userId?: string | null, limit = 30) {
  const queryClient = useQueryClient();
  const effectiveUserId = userId || "default_user";

  const query = useQuery({
    queryKey: ["nutrition", "weight", effectiveUserId, limit],
    queryFn: async () => {
      if (!userId) return [];
      return await api.getWeightHistory(effectiveUserId, limit);
    },
    enabled: !!effectiveUserId,
  });

  const logWeightMutation = useMutation({
    mutationFn: async (weightKg: number) => {
      return await api.logWeight(effectiveUserId, weightKg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition", "weight", effectiveUserId] });
    },
  });

  return {
    ...query,
    weightHistory: query.data || [],
    logWeight: logWeightMutation.mutateAsync,
    isLoggingWeight: logWeightMutation.isPending,
  };
}
