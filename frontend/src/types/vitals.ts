/**
 * Vitals data structures supporting both manual entry and Health Connect (Realme Link) live sync.
 */

export type VitalType = "heart_rate" | "hrv" | "spo2" | "steps" | "sleep" | "readiness";

export type VitalSource = 
  | "manual" 
  | "healthConnect" 
  | "google_health_connect" 
  | "google_fit" 
  | "garmin" 
  | "fitbit" 
  | "apple_health" 
  | "samsung_health" 
  | "mock";

export interface VitalReading {
  id: string;
  type: VitalType;
  value: number;
  unit: string;
  timestamp: string; // ISO 8601 string
  source: VitalSource;
  note?: string;
  extra?: {
    sleepScore?: number;
    sleepHours?: number;
    restingHr?: number;
    activityMinutes?: number;
    rawRecordId?: string;
    [key: string]: any;
  };
}

export interface VitalsSnapshot {
  source: VitalSource | "not_synced";
  heart_rate?: number | null;
  hrv?: number | null;
  spo2?: number | null;
  steps?: number | null;
  sleep_hours?: number | null;
  sleep_score?: number | null;
  readiness_score?: number | null;
  calories_burned?: number | null;
  active_minutes?: number | null;
  timestamp?: string | null;
  readings?: VitalReading[];
}

export interface HealthConnectAvailability {
  available: boolean;
  status: "available" | "not_installed" | "not_supported" | "web_environment";
  message: string;
}

export interface HealthConnectSyncResult {
  success: boolean;
  readingsCount: number;
  timestamp: string;
  source: "healthConnect";
  snapshot: Partial<VitalsSnapshot>;
  error?: string;
}
