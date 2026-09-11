/**
 * DATA OWNERSHIP MAPPING — EXERCISE & WORKOUT SECTION
 * -----------------------------------------------------------------------------
 * Auth: Firebase Auth (userId = user.uid)
 * Data Store: FastAPI Backend + SQLite (physiotwin.db)
 * Endpoints:
 *   - GET  /workouts/{userId}?limit={limit}
 *   - POST /workouts/{userId}
 *   - POST /workouts/{workoutId}/exercises
 *   - POST /workouts/{workoutId}/exercises/{workoutExerciseId}/sets
 *   - PATCH /workouts/{workoutId}
 *   - DELETE /workouts/{workoutId}
 *   - POST /workouts/{workoutId}/image
 *   - GET  /workouts/{userId}/templates
 *   - POST /workouts/{userId}/templates
 *   - GET  /workouts/{userId}/stats
 *   - POST /workouts/seed-week/{userId}
 *   - GET  /exercises (Catalog / Reference library)
 *
 * Reactivity: React Query caching with instant queryClient invalidation on all workout mutations.
 * -----------------------------------------------------------------------------
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export interface LoggedSet {
  id?: string;
  set_number: number;
  set_type?: string;
  weight_kg?: number;
  reps?: number;
  rpe?: number;
  is_completed?: boolean;
}

export interface LoggedWorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id?: string;
  exercise_name?: string;
  muscle_group?: string;
  order_index?: number;
  sets: LoggedSet[];
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  name: string;
  date: string;
  duration_seconds: number;
  notes?: string;
  template_id?: string;
  is_completed: number;
  cover_image_path?: string;
  image_url?: string;
  total_volume_kg: number;
  created_at?: string;
  exercises?: LoggedWorkoutExercise[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeightKg: number;
  maxReps: number;
  est1RmKg: number;
  dateAchieved: string;
}

export interface DerivedWorkoutStats {
  weeklyVolumeKg: number;
  totalWorkouts: number;
  activeStreakDays: number;
  personalRecords: PersonalRecord[];
  recentDaysVolume: { date: string; dayName: string; volumeKg: number }[];
}

export function useRecentWorkouts(userId?: string | null, limit = 30) {
  const queryClient = useQueryClient();
  const effectiveUserId = userId || "default_user";

  const queryKey = ["workouts", effectiveUserId, limit];

  const query = useQuery<WorkoutSession[]>({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];
      return await api.getWorkouts(effectiveUserId, limit);
    },
    enabled: !!effectiveUserId,
  });

  const workouts = query.data || [];
  const isEmpty = !query.isLoading && workouts.length === 0;

  // Invalidate all workout & strain queries upon any change
  const invalidateAllWorkoutData = () => {
    queryClient.invalidateQueries({ queryKey: ["workouts", effectiveUserId] });
    queryClient.invalidateQueries({ queryKey: ["strain", effectiveUserId] });
  };

  // Mutations
  const createWorkoutMutation = useMutation({
    mutationFn: async (data: { name?: string; notes?: string; template_id?: string }) => {
      return await api.createWorkout(effectiveUserId, data);
    },
    onSuccess: invalidateAllWorkoutData,
  });

  const addExerciseMutation = useMutation({
    mutationFn: async ({ workoutId, exerciseId, orderIndex }: { workoutId: string; exerciseId: string; orderIndex?: number }) => {
      return await api.addWorkoutExercise(workoutId, { exercise_id: exerciseId, order_index: orderIndex });
    },
    onSuccess: invalidateAllWorkoutData,
  });

  const logSetMutation = useMutation({
    mutationFn: async ({
      workoutId,
      workoutExerciseId,
      setNumber,
      setType,
      weightKg,
      reps,
      rpe,
      isCompleted,
    }: {
      workoutId: string;
      workoutExerciseId: string;
      setNumber: number;
      setType?: string;
      weightKg?: number;
      reps?: number;
      rpe?: number;
      isCompleted?: boolean;
    }) => {
      return await api.logSet(workoutId, workoutExerciseId, {
        set_number: setNumber,
        set_type: setType,
        weight_kg: weightKg,
        reps,
        rpe,
        is_completed: isCompleted,
      });
    },
    onSuccess: invalidateAllWorkoutData,
  });

  const finishWorkoutMutation = useMutation({
    mutationFn: async ({
      workoutId,
      name,
      notes,
      durationSeconds,
      photo,
    }: {
      workoutId: string;
      name?: string;
      notes?: string;
      durationSeconds?: number;
      photo?: File | null;
    }) => {
      const res = await api.finishWorkout(workoutId, { name, notes, duration_seconds: durationSeconds });
      if (photo) {
        await api.uploadWorkoutImage(workoutId, photo);
      }
      return res;
    },
    onSuccess: invalidateAllWorkoutData,
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      return await api.deleteWorkout(workoutId);
    },
    onSuccess: invalidateAllWorkoutData,
  });

  const seedWorkoutWeekMutation = useMutation({
    mutationFn: async () => {
      return await api.seedWorkoutWeek(effectiveUserId);
    },
    onSuccess: invalidateAllWorkoutData,
  });

  return {
    ...query,
    workouts,
    isEmpty,
    createWorkout: createWorkoutMutation.mutateAsync,
    isCreatingWorkout: createWorkoutMutation.isPending,
    addExercise: addExerciseMutation.mutateAsync,
    isAddingExercise: addExerciseMutation.isPending,
    logSet: logSetMutation.mutateAsync,
    isLoggingSet: logSetMutation.isPending,
    finishWorkout: finishWorkoutMutation.mutateAsync,
    isFinishingWorkout: finishWorkoutMutation.isPending,
    deleteWorkout: deleteWorkoutMutation.mutateAsync,
    isDeletingWorkout: deleteWorkoutMutation.isPending,
    seedWorkoutWeek: seedWorkoutWeekMutation.mutateAsync,
    isSeedingWorkoutWeek: seedWorkoutWeekMutation.isPending,
  };
}

export function useWorkoutTemplates(userId?: string | null) {
  const queryClient = useQueryClient();
  const effectiveUserId = userId || "default_user";

  const query = useQuery({
    queryKey: ["workouts", "templates", effectiveUserId],
    queryFn: async () => {
      if (!userId) return [];
      return await api.getWorkoutTemplates(effectiveUserId);
    },
    enabled: !!effectiveUserId,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; exercises_json?: string }) => {
      return await api.createWorkoutTemplate(effectiveUserId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts", "templates", effectiveUserId] });
    },
  });

  return {
    ...query,
    templates: query.data || [],
    createTemplate: createTemplateMutation.mutateAsync,
    isCreatingTemplate: createTemplateMutation.isPending,
  };
}

/**
 * Derives comprehensive athletic stats client-side directly from real workout logs
 */
export function useWorkoutDerivedStats(userId?: string | null): {
  stats: DerivedWorkoutStats;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
} {
  const { workouts, isLoading, isError, isEmpty } = useRecentWorkouts(userId, 60);

  if (isLoading || isError || workouts.length === 0) {
    return {
      stats: {
        weeklyVolumeKg: 0,
        totalWorkouts: 0,
        activeStreakDays: 0,
        personalRecords: [],
        recentDaysVolume: [],
      },
      isLoading,
      isError,
      isEmpty,
    };
  }

  // 1. Calculate 7-day rolling volume
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  let weeklyVolumeKg = 0;
  const daysMap: Record<string, number> = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    daysMap[dateStr] = 0;
  }

  const uniqueActiveDates = new Set<string>();
  const prMap: Record<string, PersonalRecord> = {};

  for (const w of workouts) {
    const wDate = new Date(w.date || w.created_at || Date.now());
    const dateStr = wDate.toISOString().split("T")[0];

    if (w.is_completed) {
      uniqueActiveDates.add(dateStr);
    }

    const vol = w.total_volume_kg || 0;
    if (wDate >= sevenDaysAgo) {
      weeklyVolumeKg += vol;
    }

    if (dateStr in daysMap) {
      daysMap[dateStr] += vol;
    }

    // Process PRs from sets
    if (w.exercises && Array.isArray(w.exercises)) {
      for (const we of w.exercises) {
        const exId = we.exercise_id || we.exercise_name || "ex";
        const exName = we.exercise_name || "Exercise";

        if (we.sets && Array.isArray(we.sets)) {
          for (const s of we.sets) {
            if (s.is_completed && (s.weight_kg || 0) > 0) {
              const weight = s.weight_kg || 0;
              const reps = s.reps || 1;
              // Epley formula for estimated 1RM: Weight * (1 + Reps/30)
              const est1rm = Math.round(weight * (1 + reps / 30) * 10) / 10;

              if (!prMap[exId] || weight > prMap[exId].maxWeightKg) {
                prMap[exId] = {
                  exerciseId: exId,
                  exerciseName: exName,
                  maxWeightKg: weight,
                  maxReps: reps,
                  est1RmKg: est1rm,
                  dateAchieved: dateStr,
                };
              }
            }
          }
        }
      }
    }
  }

  // 2. Compute active consecutive streak days
  let streak = 0;
  let checkDate = new Date();
  // Check if today or yesterday was logged
  const todayStr = checkDate.toISOString().split("T")[0];
  checkDate.setDate(checkDate.getDate() - 1);
  const yesterdayStr = checkDate.toISOString().split("T")[0];

  if (uniqueActiveDates.has(todayStr) || uniqueActiveDates.has(yesterdayStr)) {
    let curr = new Date(uniqueActiveDates.has(todayStr) ? todayStr : yesterdayStr);
    while (true) {
      const cStr = curr.toISOString().split("T")[0];
      if (uniqueActiveDates.has(cStr)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const recentDaysVolume = Object.entries(daysMap).map(([date, volumeKg]) => {
    const d = new Date(date + "T00:00:00");
    return {
      date,
      dayName: dayNames[d.getDay()],
      volumeKg: Math.round(volumeKg),
    };
  });

  return {
    stats: {
      weeklyVolumeKg: Math.round(weeklyVolumeKg),
      totalWorkouts: workouts.filter((w) => w.is_completed).length,
      activeStreakDays: streak,
      personalRecords: Object.values(prMap),
      recentDaysVolume,
    },
    isLoading: false,
    isError: false,
    isEmpty: false,
  };
}
