import { Health } from '@capgo/capacitor-health';
import { Capacitor } from '@capacitor/core';
import { api } from '../api';
import type { VitalReading, VitalsSnapshot, HealthConnectAvailability, HealthConnectSyncResult } from '../types/vitals';

export const HEALTH_CONNECT_READ_TYPES: Array<'heartRate' | 'oxygenSaturation' | 'sleep' | 'steps'> = [
  'heartRate',
  'oxygenSaturation',
  'sleep',
  'steps'
];

const LOCAL_STORAGE_READINGS_KEY = 'physiotwin_vital_readings';
const LOCAL_STORAGE_LAST_SYNC_KEY = 'physiotwin_health_connect_last_sync';

/**
 * 1. Check if Health Connect is installed and available on this device.
 */
export async function checkAvailability(): Promise<HealthConnectAvailability> {
  const isNative = Capacitor.isNativePlatform();
  if (!isNative) {
    return {
      available: false,
      status: 'web_environment',
      message: 'Running in Web browser. Native Health Connect bridge requires running the Android app.'
    };
  }

  try {
    const res = await Health.isAvailable();
    if (res.available) {
      return {
        available: true,
        status: 'available',
        message: 'Android Health Connect is ready and active.'
      };
    } else {
      return {
        available: false,
        status: res.reason === 'not_installed' ? 'not_installed' : 'not_supported',
        message: res.reason || 'Health Connect is not installed or not supported on this Android OS version.'
      };
    }
  } catch (err: any) {
    return {
      available: false,
      status: 'not_supported',
      message: err.message || 'Failed to detect Health Connect availability.'
    };
  }
}

/**
 * 2. Request read permissions for Realme Watch data types (Heart Rate, SpO2, Sleep, Steps).
 */
export async function requestVitalsPermissions(): Promise<{ granted: boolean; grantedTypes: string[]; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { granted: false, grantedTypes: [], error: 'Health Connect permissions can only be requested on Android.' };
  }

  try {
    const status = await Health.requestAuthorization({
      read: HEALTH_CONNECT_READ_TYPES,
      requestHistoryAccess: true
    });

    const grantedTypes = status.readAuthorized || [];
    const granted = grantedTypes.length > 0;

    return {
      granted,
      grantedTypes,
    };
  } catch (err: any) {
    console.error('Failed to request Health Connect permissions:', err);
    return {
      granted: false,
      grantedTypes: [],
      error: err.message || 'Permission request was cancelled or failed.'
    };
  }
}

/**
 * Open Health Connect system settings so user can verify permissions or grant access.
 */
export async function openHealthConnectSettings(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Health.openHealthConnectSettings();
    } catch (e) {
      console.warn('Could not open Health Connect settings directly:', e);
    }
  }
}

/**
 * Retrieve previously saved local readings.
 */
export function getStoredReadings(userId: string): VitalReading[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_READINGS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save manual or synced vital readings to local storage.
 */
export function saveVitalReading(userId: string, reading: VitalReading): VitalReading[] {
  const existing = getStoredReadings(userId);
  // Deduplicate by timestamp and type
  const filtered = existing.filter(r => !(r.type === reading.type && r.timestamp === reading.timestamp));
  const updated = [reading, ...filtered].slice(0, 100);
  try {
    localStorage.setItem(`${LOCAL_STORAGE_READINGS_KEY}_${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save reading locally:', e);
  }
  return updated;
}

/**
 * Get timestamp of the last successful sync.
 */
export function getLastSyncTime(userId: string): string | null {
  return localStorage.getItem(`${LOCAL_STORAGE_LAST_SYNC_KEY}_${userId}`);
}

/**
 * 3. Sync vitals from Health Connect (Realme Link data).
 * Reads heartRate, oxygenSaturation, sleep, steps, deduplicates against stored records,
 * and synchronizes with FastAPI backend and local store.
 */
export async function syncFromHealthConnect(
  userId: string,
  options: { lookbackDays?: number } = {}
): Promise<HealthConnectSyncResult> {
  const now = new Date();
  const lookbackDays = options.lookbackDays || 7;
  const startDateObj = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const startDate = startDateObj.toISOString();
  const endDate = now.toISOString();

  if (!Capacitor.isNativePlatform()) {
    // If running in development/web mode, return simulated sync or error notice
    return {
      success: false,
      readingsCount: 0,
      timestamp: now.toISOString(),
      source: 'healthConnect',
      snapshot: {},
      error: 'Health Connect native sync requires running inside the Android APK. Web mode active.'
    };
  }

  try {
    // 1. Query samples in parallel
    const [hrRes, spo2Res, sleepRes, stepsRes] = await Promise.all([
      Health.readSamples({ dataType: 'heartRate', startDate, endDate, limit: 100 }).catch(() => ({ samples: [] })),
      Health.readSamples({ dataType: 'oxygenSaturation', startDate, endDate, limit: 100 }).catch(() => ({ samples: [] })),
      Health.readSamples({ dataType: 'sleep', startDate, endDate, limit: 50 }).catch(() => ({ samples: [] })),
      Health.readSamples({ dataType: 'steps', startDate, endDate, limit: 100 }).catch(() => ({ samples: [] }))
    ]);

    const newReadings: VitalReading[] = [];

    // Map Heart Rate samples
    let latestHr: number | null = null;
    if (hrRes.samples && hrRes.samples.length > 0) {
      hrRes.samples.forEach((s: any) => {
        newReadings.push({
          id: `hc-hr-${s.platformId || s.startDate}`,
          type: 'heart_rate',
          value: Math.round(s.value),
          unit: 'bpm',
          timestamp: s.endDate || s.startDate,
          source: 'healthConnect',
          extra: { sourceName: s.sourceName || 'Realme Link (Health Connect)' }
        });
      });
      latestHr = Math.round(hrRes.samples[hrRes.samples.length - 1].value);
    }

    // Map SpO2 samples
    let latestSpo2: number | null = null;
    if (spo2Res.samples && spo2Res.samples.length > 0) {
      spo2Res.samples.forEach((s: any) => {
        // Values can be 0.98 or 98
        const val = s.value <= 1 ? Math.round(s.value * 100) : Math.round(s.value);
        newReadings.push({
          id: `hc-spo2-${s.platformId || s.startDate}`,
          type: 'spo2',
          value: val,
          unit: '%',
          timestamp: s.endDate || s.startDate,
          source: 'healthConnect',
          extra: { sourceName: s.sourceName || 'Realme Link (Health Connect)' }
        });
      });
      const last = spo2Res.samples[spo2Res.samples.length - 1].value;
      latestSpo2 = last <= 1 ? Math.round(last * 100) : Math.round(last);
    }

    // Map Sleep samples
    let totalSleepHours: number | null = null;
    let sleepScore: number | null = null;
    if (sleepRes.samples && sleepRes.samples.length > 0) {
      let sleepMinutes = 0;
      sleepRes.samples.forEach((s: any) => {
        const start = new Date(s.startDate).getTime();
        const end = new Date(s.endDate).getTime();
        const durationMins = Math.max(0, (end - start) / 60000);
        sleepMinutes += durationMins;

        newReadings.push({
          id: `hc-sleep-${s.platformId || s.startDate}`,
          type: 'sleep',
          value: Math.round((durationMins / 60) * 10) / 10,
          unit: 'hrs',
          timestamp: s.endDate,
          source: 'healthConnect',
          extra: {
            sleepState: s.sleepState,
            stages: s.stages,
            sourceName: s.sourceName || 'Realme Link'
          }
        });
      });
      totalSleepHours = Math.round((sleepMinutes / 60) * 10) / 10;
      sleepScore = Math.min(100, Math.round((totalSleepHours / 8.0) * 88));
    }

    // Map Steps samples
    let totalSteps: number | null = null;
    if (stepsRes.samples && stepsRes.samples.length > 0) {
      let sum = 0;
      stepsRes.samples.forEach((s: any) => {
        sum += Math.round(s.value);
      });
      totalSteps = sum;
      newReadings.push({
        id: `hc-steps-${now.toISOString().split('T')[0]}`,
        type: 'steps',
        value: totalSteps,
        unit: 'steps',
        timestamp: now.toISOString(),
        source: 'healthConnect',
        extra: { sourceName: 'Realme Link (Health Connect)' }
      });
    }

    // Deduplicate against local storage readings
    const existing = getStoredReadings(userId);
    const existingIds = new Set(existing.map(r => r.id));
    const merged = [...existing];

    newReadings.forEach(r => {
      if (!existingIds.has(r.id)) {
        merged.push(r);
        existingIds.add(r.id);
      }
    });

    // Keep sorted by timestamp descending
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    localStorage.setItem(`${LOCAL_STORAGE_READINGS_KEY}_${userId}`, JSON.stringify(merged.slice(0, 150)));
    localStorage.setItem(`${LOCAL_STORAGE_LAST_SYNC_KEY}_${userId}`, now.toISOString());

    // Calculate derived readiness score
    const readinessScore = latestHr && totalSleepHours 
      ? Math.min(100, Math.max(30, Math.round(50 + (totalSleepHours >= 7 ? 25 : 10) + (latestHr <= 65 ? 20 : 5))))
      : 85;

    const snapshot: Partial<VitalsSnapshot> = {
      source: 'healthConnect',
      heart_rate: latestHr,
      spo2: latestSpo2,
      steps: totalSteps,
      sleep_hours: totalSleepHours,
      sleep_score: sleepScore,
      readiness_score: readinessScore,
      timestamp: now.toISOString(),
      readings: merged.slice(0, 20)
    };

    // Synchronize snapshot with FastAPI backend
    await api.syncWearableData(userId, {
      source: 'google_health_connect',
      heart_rate: latestHr ?? undefined,
      spo2: latestSpo2 ?? undefined,
      steps: totalSteps ?? undefined,
      sleep_hours: totalSleepHours ?? undefined,
      sleep_score: sleepScore ?? undefined,
      readiness_score: readinessScore,
      raw_data: JSON.stringify({ samplesCount: newReadings.length, source: 'Realme Link via Health Connect' })
    }).catch(err => {
      console.warn('Backend vitals sync notice:', err);
    });

    return {
      success: true,
      readingsCount: newReadings.length,
      timestamp: now.toISOString(),
      source: 'healthConnect',
      snapshot
    };
  } catch (err: any) {
    console.error('Health Connect sync failed:', err);
    return {
      success: false,
      readingsCount: 0,
      timestamp: now.toISOString(),
      source: 'healthConnect',
      snapshot: {},
      error: err.message || 'Failed to read records from Health Connect'
    };
  }
}
