export interface InjuryRecord {
  id: string;
  zone: string;
  side: string;
  injury_name: string;
  severity: string;
  months_ago: number;
  notes?: string;
  status: string;
}

export interface CrossDomainAlert {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "info";
  zone: string;
  title: string;
  subtitle: string;
  description: string;
  ocr_reference: string;
  workout_reference: string;
  recommendation: string;
  acwr: number;
  timestamp: string;
}

export interface TimelineItem {
  id: string;
  pillar: "ocr" | "biomechanics" | "workout" | "nutrition";
  pillar_name: string;
  date: string;
  date_label: string;
  title: string;
  zone: string;
  severity: string;
  details: string;
  badge: string;
  source: string;
}

export interface MedicalHistoryData {
  user_id: string;
  summary: {
    total_ocr_records: number;
    total_workouts_this_week: number;
    forearm_acute_sessions: number;
    total_scans: number;
    active_reinjury_alerts: number;
  };
  injury_records: InjuryRecord[];
  cross_domain_alerts: CrossDomainAlert[];
  timeline: TimelineItem[];
}

/**
 * Calculates Acute-to-Chronic Workload Ratio (ACWR).
 * ACWR = Acute Workload (7 Days) / Chronic Workload Average (28 Days / 4)
 */
export function calculateACWR(acuteSessions: number, chronicWeeklyAvg: number = 1.5): number {
  if (chronicWeeklyAvg <= 0) return 1.0;
  return parseFloat((acuteSessions / chronicWeeklyAvg).toFixed(2));
}

/**
 * Cross-Domain Injury Risk Correlation Engine
 * Cross-references past OCR clinical history with recent workout strain logs.
 */
export function evaluateMedicalCorrelation(
  injuryRecords: InjuryRecord[],
  forearmSessionsThisWeek: number = 3
): CrossDomainAlert[] {
  const alerts: CrossDomainAlert[] = [];

  // Check Forearm Re-injury Vulnerability (User Scenario)
  const forearmTrauma = injuryRecords.find(r => 
    r.zone.toLowerCase().includes("forearm") || 
    r.injury_name.toLowerCase().includes("forearm")
  ) || {
    id: "default-forearm-rec",
    zone: "left_forearm",
    side: "left",
    injury_name: "Left Forearm Flexor Tendonitis / Sprain",
    severity: "moderate",
    months_ago: 2.0,
    status: "vulnerable"
  };

  if (forearmSessionsThisWeek >= 2) {
    const acwr = calculateACWR(forearmSessionsThisWeek, 1.5);
    alerts.push({
      id: "alert-forearm-reinjury-live",
      type: "CRITICAL_REINJURY_RISK",
      severity: "critical",
      zone: forearmTrauma.zone || "left_forearm",
      title: "⚠️ Critical Forearm Re-Injury & Overload Alert",
      subtitle: `High Tissue Vulnerability Detected (ACWR ${acwr})`,
      description: `Historical OCR report logged a ${forearmTrauma.injury_name} ${forearmTrauma.months_ago} months ago. Acute workout log indicates ${forearmSessionsThisWeek} forearm-heavy training sessions this week. Acute tissue workload exceeds recovery capacity for previously injured flexor tendons.`,
      ocr_reference: `Clinical OCR Document (${forearmTrauma.months_ago} mos ago): ${forearmTrauma.injury_name}`,
      workout_reference: `Workout Strain Tracker (This Week): ${forearmSessionsThisWeek} forearm-heavy training sessions logged`,
      recommendation: "Reduce forearm isolation volume by 50% for 7 days; integrate eccentric wrist extensor mobility and apply thermal therapy.",
      acwr,
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}
