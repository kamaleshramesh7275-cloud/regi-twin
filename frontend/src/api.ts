const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE = isLocal ? `http://${window.location.hostname}:8000` : '';

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
  async getDashboard(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/dashboard/${userId}?min_hours_ago=1&max_hours_ago=10`);
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    return res.json();
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

  // ── MANUAL WORKOUT LOGGING ───────────────────────────────────────────────────

  async getWorkouts(userId: string, limit = 50) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch workouts");
    return res.json();
  },

  async logWorkout(userId: string, data: {
    name: string;
    duration_min?: number;
    notes?: string;
    exercises?: { name: string; sets: number; reps: number; weight_kg: number }[];
    affected_zones?: string[];
    load_level?: string;
  }) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/log/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to log workout");
    return res.json();
  },

  async deleteWorkout(logId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/workouts/${logId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete workout");
    return res.json();
  },

  // ── MANUAL NUTRITION LOGGING ─────────────────────────────────────────────────

  async getNutrition(userId: string, days = 7) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/${userId}?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch nutrition logs");
    return res.json();
  },

  async logNutrition(userId: string, data: {
    meal_name?: string;
    items?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  }) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/log/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to log nutrition");
    return res.json();
  },

  async deleteNutritionLog(logId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/nutrition/${logId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete nutrition log");
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
};

