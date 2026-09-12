import { offlineStorage } from "./lib/offlineStorage";

const isLocalOrLAN = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  /^172\.|^192\.168\.|^10\./.test(window.location.hostname) ||
  window.location.hostname.endsWith('.local')
);

// In browser, relative URL ('') automatically uses Vite's reverse proxy for seamless HTTPS & CORS
const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:8000';


async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const api = {
  async getAppVersion() {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/app/version`, { timeout: 3000 });
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
    return null;
  },

  async getDashboard(userId: string) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/analytics/dashboard/${userId}?min_hours_ago=1&max_hours_ago=10`);
      if (res.ok) {
        const data = await res.json();
        offlineStorage.setCache(`dashboard_${userId}`, data).catch(() => {});
        return data;
      }
    } catch (err) {
      console.warn("Network request for dashboard failed, attempting offline cache lookup:", err);
    }
    const cached = await offlineStorage.getCache(`dashboard_${userId}`);
    if (cached) return cached;
    throw new Error("Failed to fetch dashboard and no offline cache available");
  },
  
  async getWeeklyLetter(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/weekly-letter/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Failed to generate letter");
    return res.json();
  },

  async submitVisionSession(data: any) {
    const res = await fetchWithTimeout(`${API_BASE}/sessions/vision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit session");
    return res.json();
  },

  async getSessionHistory(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/sessions/history/${userId}?min_hours_ago=1&max_hours_ago=10`);
    if (!res.ok) throw new Error("Failed to fetch session history");
    return res.json();
  },

  async getDeepInsights(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/deep-insights/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000
    });
    if (!res.ok) throw new Error("Failed to generate deep insights");
    return res.json();
  },

  async uploadMedicalReport(userId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    
    // Don't use fetchWithTimeout here because upload/analysis might take a while
    const res = await fetch(`${API_BASE}/reports/analyze/${userId}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to analyze medical report");
    return res.json();
  },

  async chatWithTwin(userId: string, messages: {role: string, content: string}[]) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/chat/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error("Failed to chat with twin");
    return res.json();
  },

  async simulateActivity(userId: string, data: {activity_type: string, duration_mins: number, intensity: string}) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/simulate/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to simulate activity");
    return res.json();
  },

  async getLeaderboard() {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/leaderboard`);
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
  },

  async getExternalApps(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/external-apps/${userId}?min_hours_ago=1&max_hours_ago=10`);
    if (!res.ok) throw new Error("Failed to fetch external app data");
    return res.json();
  },

  async calculateDynamicRisk(baseRisk: any, fitData: any) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/dynamic-risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base_risk: baseRisk, fit_data: fitData }),
    });
    if (!res.ok) throw new Error("Failed to calculate dynamic risk");
    return res.json();
  },

  async syncExternalApps(userId: string, workouts: any[], nutrition: any) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/external-apps/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workouts, nutrition }),
    });
    if (!res.ok) throw new Error("Failed to sync external apps");
    return res.json();
  },

  async syncHealthConnect(userId: string, workouts: any[], nutrition: any) {
    const res = await fetchWithTimeout(`${API_BASE}/health-connect/sync/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workouts, nutrition }),
    });
    if (!res.ok) throw new Error("Failed to sync Health Connect");
    return res.json();
  },

  /** Push a vitals snapshot synced from a consumer smartwatch/band platform API */
  async syncWearableData(userId: string, data: {
    source: string;          // 'google_fit' | 'garmin' | 'fitbit' | 'apple_health' | 'samsung_health'
    heart_rate?: number;
    hrv?: number;
    spo2?: number;
    steps?: number;
    sleep_hours?: number;
    sleep_score?: number;
    readiness_score?: number;
    calories_burned?: number;
    active_minutes?: number;
    raw_data?: string;
  }) {
    const res = await fetchWithTimeout(`${API_BASE}/wearables/sync/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to sync wearable data");
    return res.json();
  },

  /** Fetch the most recently synced wearable vitals for a user */
  async getLatestWearable(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/wearables/latest/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch wearable data");
    return res.json();
  },

  async getWearableHistory(userId: string, limit = 7) {
    const res = await fetchWithTimeout(`${API_BASE}/wearables/history/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch wearable history");
    return res.json();
  },

  /** Request generation of a customized rehab program based on capability profile */
  async generateProgram(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/programs/generate/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to generate program");
    return res.json();
  },

  /** Get chat history for dynamic twin */
  async getChatHistory(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/chat/history/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch chat history");
    return res.json();
  },

  /** Clear chat history */
  async clearChatHistory(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/chat/history/${userId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to clear chat history");
    return res.json();
  },

  /** Log dynamic daily pain intensity */
  async logPain(userId: string, data: { zone: string, score: number }) {
    const res = await fetchWithTimeout(`${API_BASE}/pain/log/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to log pain");
    return res.json();
  },

  /** Fetch user's pain log history */
  async getPainHistory(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/pain/history/${userId}?min_hours_ago=1&max_hours_ago=10`);
    if (!res.ok) throw new Error("Failed to fetch pain history");
    return res.json();
  },

  /** Submit TSK-11 kinesiophobia survey results */
  async submitTriage(userId: string, data: { score: number, answers_json: string }) {
    const res = await fetchWithTimeout(`${API_BASE}/users/triage/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to submit triage score");
    return res.json();
  },

  /** Save/update comprehensive user baseline profile */
  async saveUserProfile(userId: string, profile: any) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: profile.email || `${userId}@physiotwin.local`,
          age: profile.age,
          sex: profile.biologicalSex || profile.biological_sex,
          height: profile.heightCm || profile.height_cm,
          weight: profile.weightKg || profile.weight_kg,
          mode: profile.twinMode || profile.twin_mode,
          goals: profile.goals || [],
          consent: profile.consent ?? true
        })
      });
      if (res.ok) return res.json();
    } catch (err) {
      console.warn("Backend saveUserProfile fallback:", err);
    }
    return profile;
  },

  /** Get user profile details from backend or local cache fallback */
  async getUserProfile(userId: string) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/users/${userId}`);
      if (res.ok) return res.json();
    } catch (err) {
      console.warn("Backend getUserProfile fallback to cache:", err);
    }
    const cached = localStorage.getItem(`pt_user_seed_${userId}`);
    if (cached) return JSON.parse(cached);
    return null;
  },

  /** Fetch professional clinical case notes */
  async getCaseNotes(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/clinic/casenotes/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch case notes");
    return res.json();
  },

  /** Create a professional clinical case note */
  async createCaseNote(userId: string, note: string) {
    const res = await fetchWithTimeout(`${API_BASE}/clinic/casenotes/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note })
    });
    if (!res.ok) throw new Error("Failed to create case note");
    return res.json();
  },

  /** Feature 2: Get live analytics summary (ROM trend, capability trend, pain overlay, zone heatmap) */
  async getAnalyticsSummary(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/summary/${userId}?min_hours_ago=1&max_hours_ago=10`);
    if (!res.ok) throw new Error("Failed to fetch analytics summary");
    return res.json();
  },

  /** Feature 8: Get injury risk prediction for next 7 days */
  async getInjuryRisk(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/injury-risk/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch injury risk");
    return res.json();
  },

  /** Feature 4: Upload a wearable CSV file (Garmin / Fitbit / Apple Health) */
  async importWearableCsv(userId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/wearable/import-csv/${userId}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to import wearable CSV");
    return res.json();
  },

  /** Feature 9: Get clinic patient roster (therapist admin view) */
  async getClinicRoster(adminKey = "physiotwin-admin-2026") {
    const res = await fetchWithTimeout(`${API_BASE}/clinic/roster?admin_key=${adminKey}`);
    if (!res.ok) throw new Error("Failed to fetch clinic roster");
    return res.json();
  },

  /** Feature 9: Get detailed summary for one patient */
  async getPatientSummary(userId: string, adminKey = "physiotwin-admin-2026") {
    const res = await fetchWithTimeout(`${API_BASE}/clinic/patient/${userId}?admin_key=${adminKey}`);
    if (!res.ok) throw new Error("Failed to fetch patient summary");
    return res.json();
  },

  // ── MEDICATIONS ─────────────────────────────────────────────────────────────

  async getMedications(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/medications/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch medications");
    return res.json();
  },

  async addMedication(userId: string, data: { name: string; dosage: string; time_of_day: string; type: string }) {
    const res = await fetchWithTimeout(`${API_BASE}/medications/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add medication");
    return res.json();
  },

  async toggleMedication(medId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/medications/${medId}/toggle`, { method: "PATCH" });
    if (!res.ok) throw new Error("Failed to toggle medication");
    return res.json();
  },

  async deleteMedication(medId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/medications/${medId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete medication");
    return res.json();
  },

  // ── COMMUNITY POSTS ──────────────────────────────────────────────────────────

  async getCommunityPosts(limit = 20) {
    const res = await fetchWithTimeout(`${API_BASE}/community/posts?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch community posts");
    return res.json();
  },

  async createCommunityPost(userId: string, data: { author_name: string; group_name: string; title: string; content: string }) {
    const res = await fetchWithTimeout(`${API_BASE}/community/posts/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create community post");
    return res.json();
  },

  async likeCommunityPost(postId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/community/posts/${postId}/like`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to like post");
    return res.json();
  },

  // ── NATIVE EXERCISE CATALOG ──────────────────────────────────────────────────

  async getExercises(params?: { category?: string; equipment?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.equipment) query.append('equipment', params.equipment);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const cacheKey = `exercises_${qs || 'all'}`;

    try {
      const res = await fetchWithTimeout(`${API_BASE}/exercises${qs}`);
      if (res.ok) {
        const data = await res.json();
        offlineStorage.setCache(cacheKey, data).catch(() => {});
        return data;
      }
    } catch (err) {
      console.warn("Network request for exercises failed, attempting offline cache lookup:", err);
    }
    const cached = await offlineStorage.getCache(cacheKey);
    if (cached) return cached;
    const allCached = await offlineStorage.getCache('exercises_all');
    if (allCached) return allCached;
    throw new Error("Failed to fetch exercises and no offline cache available");
  },

  async getExercise(exerciseId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/exercises/${exerciseId}`);
    if (!res.ok) throw new Error("Failed to fetch exercise details");
    return res.json();
  },

  // ── NATIVE WORKOUT LOGGER & STRAIN ──────────────────────────────────────────

  async getWorkouts(userId: string, limit = 50) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch workouts");
    return res.json();
  },

  async createWorkout(userId: string, data: { name?: string; notes?: string; template_id?: string } = {}) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create workout session");
    return res.json();
  },

  async addWorkoutExercise(workoutId: string, data: { exercise_id: string; order_index?: number }) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${workoutId}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add exercise to workout");
    return res.json();
  },

  async logSet(workoutId: string, workoutExerciseId: string, data: {
    set_number: number;
    set_type?: string;
    weight_kg?: number;
    reps?: number;
    rpe?: number;
    is_completed?: boolean;
  }) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to log set");
    return res.json();
  },

  async finishWorkout(workoutId: string, data: { name?: string; notes?: string; duration_seconds?: number } = {}) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${workoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to complete workout");
    return res.json();
  },

  async deleteWorkout(workoutId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${workoutId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete workout");
    return res.json();
  },

  async uploadWorkoutImage(workoutId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/workouts/${workoutId}/image`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload workout photo");
    }
    return res.json();
  },

  async getWorkoutTemplates(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${userId}/templates`);
    if (!res.ok) throw new Error("Failed to fetch workout templates");
    return res.json();
  },

  async createWorkoutTemplate(userId: string, data: { name: string; description?: string; exercises_json?: string }) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${userId}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save template");
    return res.json();
  },

  async getWorkoutStats(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${userId}/stats`);
    if (!res.ok) throw new Error("Failed to fetch workout strain statistics");
    return res.json();
  },

  async seedWorkoutWeek(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/seed-week/${userId}`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to seed workout week");
    return res.json();
  },

  // ── NATIVE FOOD DATABASE & NUTRITION TRACKING ────────────────────────────────

  async searchFoods(query: string, category?: string) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category) params.append('category', category);
    const res = await fetchWithTimeout(`${API_BASE}/foods/search?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to search foods");
    return res.json();
  },

  async getFood(foodId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/foods/${foodId}`);
    if (!res.ok) throw new Error("Failed to fetch food details");
    return res.json();
  },

  async logNutrition(userId: string, data: {
    meal_type: string;
    items: {
      food_id?: string;
      name: string;
      portion_g: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      micros?: any;
    }[];
    notes?: string;
    logged_at?: string;
  }) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/log/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to log meal");
    }
    return res.json();
  },

  async uploadMealImage(logId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/nutrition/log/${logId}/image`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload meal photo");
    }
    return res.json();
  },

  async deleteNutritionLog(logId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/${logId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete nutrition log");
    return res.json();
  },

  async getDailyNutrition(userId: string, date?: string) {
    const url = date ? `${API_BASE}/nutrition/daily/${userId}?date=${date}` : `${API_BASE}/nutrition/daily/${userId}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error("Failed to fetch daily nutrition");
    return res.json();
  },

  async getWeeklyNutrition(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/week/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch weekly nutrition rollup");
    return res.json();
  },

  async logWater(userId: string, amount_ml: number, date?: string) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/water/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount_ml, date }),
    });
    if (!res.ok) throw new Error("Failed to log water");
    return res.json();
  },

  async getWater(userId: string, date?: string) {
    const url = date ? `${API_BASE}/nutrition/water/${userId}?date=${date}` : `${API_BASE}/nutrition/water/${userId}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error("Failed to fetch water log");
    return res.json();
  },

  async logWeight(userId: string, weight_kg: number, date?: string) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/weight/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight_kg, date }),
    });
    if (!res.ok) throw new Error("Failed to log weight");
    return res.json();
  },

  async getWeightHistory(userId: string, limit = 30) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/weight/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch weight history");
    return res.json();
  },

  async seedNutritionWeek(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/seed-week/${userId}`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to seed nutrition week");
    return res.json();
  },

  // ── DYNAMIC PROJECTIONS ──────────────────────────────────────────────────────

  async getDynamicProjections(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/projections/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch projections");
    return res.json();
  },

  // ── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

  async getAchievements(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/achievements/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch achievements");
    return res.json();
  },

  // ── READINESS SURVEYS ────────────────────────────────────────────────────────
  async getReadinessSurvey(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/readiness/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch readiness survey");
    return res.json();
  },

  async submitReadinessSurvey(userId: string, data: {
    general_stress: number;
    emotional_stress: number;
    social_stress: number;
    fatigue: number;
    energy_deficit: number;
    physical_complaints: number;
    success: number;
    social_recovery: number;
    physical_recovery: number;
    well_being: number;
    kinesiophobia_score: number;
    sport_confidence_score: number;
  }) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/readiness/survey/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit readiness survey");
    return res.json();
  },

  // ── CLINIC PORTAL — OCR LAB REPORT ANALYSIS & PREDICTIONS ───────────────────

  async uploadClinicReport(userId: string, file: File, labName?: string, reportType?: string, reportDate?: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    if (labName) formData.append("lab_name", labName);
    if (reportType) formData.append("report_type", reportType);
    if (reportDate) formData.append("report_date", reportDate);

    const res = await fetch(`${API_BASE}/api/clinic/reports/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Failed to process clinical report OCR");
    }
    return res.json();
  },

  async getClinicReports(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/api/clinic/reports/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch clinical reports");
    return res.json();
  },

  async getClinicReportDetail(reportId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/api/clinic/reports/detail/${reportId}`);
    if (!res.ok) throw new Error("Failed to fetch report detail");
    return res.json();
  },

  async confirmClinicReport(reportId: string, payload: {
    confirmed_metrics: Array<{
      metric_key: string;
      canonical_name: string;
      value: number;
      unit: string;
      ref_low?: number | null;
      ref_high?: number | null;
      status?: string;
      confidence?: string;
      confidence_score?: number;
    }>;
    report_date?: string;
    lab_name?: string;
    notes?: string;
  }) {
    const res = await fetchWithTimeout(`${API_BASE}/api/clinic/reports/${reportId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to confirm report metrics");
    return res.json();
  },

  async deleteClinicReport(reportId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/api/clinic/reports/${reportId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete report");
    return res.json();
  },

  async getClinicMetricTrends(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/api/clinic/metrics/trends/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch clinical metric trends");
    return res.json();
  },

  async getClinicNotifications(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/api/clinic/notifications/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch clinical alerts");
    return res.json();
  },

  async markClinicNotificationRead(alertId: string | number) {
    const res = await fetchWithTimeout(`${API_BASE}/api/clinic/notifications/${alertId}/read`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to mark alert as read");
    return res.json();
  },

  async seedClinicDemo(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/api/clinic/seed-demo/${userId}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to seed demo clinical data");
    return res.json();
  },

  async getMedicalHistory(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/api/medical-history/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch full medical history");
    return res.json();
  },

  async saveInjuryRecord(userId: string, payload: any) {
    const res = await fetchWithTimeout(`${API_BASE}/api/medical-history/injury-record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...payload }),
    });
    if (!res.ok) throw new Error("Failed to save injury record");
    return res.json();
  },
};




