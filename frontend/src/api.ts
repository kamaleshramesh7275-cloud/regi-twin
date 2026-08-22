const API_BASE = `http://${window.location.hostname}:8000`;

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
    const res = await fetchWithTimeout(`${API_BASE}/analytics/dashboard/${userId}`);
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
    const res = await fetchWithTimeout(`${API_BASE}/sessions/history/${userId}`);
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
    const res = await fetchWithTimeout(`${API_BASE}/analytics/external-apps/${userId}`);
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
  }
};
