import type { ZoneId } from "../HoloModel3D";
import type { GroupedRegionalInsight } from "../context/ClinicInsightsContext";

export type HeatSourceCategory = 
  | "clinicInsight" 
  | "onboardingInjury" 
  | "postureScan" 
  | "selfReportedPain" 
  | "strain";

export interface HeatSource {
  id: string;
  region: ZoneId;
  intensity: number; // 0.0 to 1.0
  radius: number;    // Influence falloff radius in mesh units
  source: HeatSourceCategory;
  label: string;
  detail: string;
  timestamp: string; // ISO date or relative description
}

export interface RegionHeatSummary {
  region: ZoneId;
  effectiveIntensity: number; // 0.0 to 1.0
  riskPercentage: number;     // 0 to 100
  label: "Healthy" | "Low Strain" | "Moderate Pain" | "High Pain/Strain";
  sources: HeatSource[];
}

/**
 * Aggregation Rule: Recency-Weighted Max with Compound Boost
 * Effective Intensity = min(1.0, maxIntensity + (count - 1) * 0.08 * recencyWeight)
 */
export function aggregateHeatSources(sources: HeatSource[]): Record<ZoneId, RegionHeatSummary> {
  const grouped: Partial<Record<ZoneId, HeatSource[]>> = {};

  for (const src of sources) {
    if (!grouped[src.region]) grouped[src.region] = [];
    grouped[src.region]!.push(src);
  }

  const result: Partial<Record<ZoneId, RegionHeatSummary>> = {};

  for (const [regionKey, regionSources] of Object.entries(grouped) as [ZoneId, HeatSource[]][]) {
    if (!regionSources || regionSources.length === 0) continue;

    // Sort by intensity descending
    const sorted = [...regionSources].sort((a, b) => b.intensity - a.intensity);
    const maxIntensity = sorted[0].intensity;

    // Compound boost for multiple overlapping sources
    const extraCount = Math.max(0, sorted.length - 1);
    const compoundBoost = extraCount * 0.08;
    const effectiveIntensity = Math.min(1.0, maxIntensity + compoundBoost);
    const riskPercentage = Math.round(effectiveIntensity * 100);

    let label: RegionHeatSummary["label"] = "Healthy";
    if (riskPercentage >= 65) label = "High Pain/Strain";
    else if (riskPercentage >= 30) label = "Moderate Pain";
    else if (riskPercentage > 0) label = "Low Strain";

    result[regionKey] = {
      region: regionKey,
      effectiveIntensity,
      riskPercentage,
      label,
      sources: sorted,
    };
  }

  return result as Record<ZoneId, RegionHeatSummary>;
}

/**
 * Collect all active heat sources across clinic insights, onboarding injuries,
 * posture scans, self-reported pain, and workout strain.
 */
export function collectAllHeatSources(options: {
  regionalInsights?: GroupedRegionalInsight[];
  userProfile?: any;
  lastSession?: any;
  selfReportedPain?: Record<string, { intensity: number; note?: string; timestamp: string }>;
}): HeatSource[] {
  const sources: HeatSource[] = [];

  // 1. Clinic Insights
  if (options.regionalInsights) {
    for (const group of options.regionalInsights) {
      if (!group.metrics || group.metrics.length === 0) continue;
      const flaggedCount = group.metrics.filter(
        m => m.latest_status === "high" || m.latest_status === "low" || m.latest_status === "flagged"
      ).length;
      
      const intensity = flaggedCount > 0 ? Math.min(1.0, 0.45 + flaggedCount * 0.2) : 0.25;
      const metricNames = group.metrics.map(m => m.canonical_name).join(", ");

      sources.push({
        id: `clinic-${group.zone}`,
        region: group.zone,
        intensity,
        radius: 0.28,
        source: "clinicInsight",
        label: "Clinic Lab Finding",
        detail: `Lab metrics: ${metricNames} (${flaggedCount > 0 ? `${flaggedCount} flagged` : 'monitored'})`,
        timestamp: "Clinic Report",
      });
    }
  }

  // 2. Onboarding Baseline Injury History
  if (options.userProfile) {
    const rawPainZone = options.userProfile.painZone || localStorage.getItem("pt_user_pain_zone");
    const rawPainLevel = options.userProfile.painLevel || localStorage.getItem("pt_user_pain_level");

    if (rawPainZone && rawPainZone !== "none") {
      const zoneKey = mapTextToZoneId(rawPainZone);
      if (zoneKey) {
        const pLevel = typeof rawPainLevel === "number" ? rawPainLevel : parseInt(rawPainLevel || "5", 10);
        const intensity = Math.min(1.0, Math.max(0.2, (pLevel || 5) / 10));

        sources.push({
          id: `onboarding-${zoneKey}`,
          region: zoneKey,
          intensity,
          radius: 0.32,
          source: "onboardingInjury",
          label: "Baseline Injury History",
          detail: `Onboarding baseline pain area (${pLevel}/10 severity)`,
          timestamp: "Baseline Intake",
        });
      }
    }
  }

  // 3. Posture Scan & Vision Kinematics
  if (options.lastSession) {
    const ls = options.lastSession;
    if (ls.shoulderTilt && ls.shoulderTilt > 2) {
      const intensity = Math.min(1.0, (ls.shoulderTilt / 10));
      sources.push({
        id: "scan-shoulder",
        region: "left_shoulder",
        intensity,
        radius: 0.26,
        source: "postureScan",
        label: "Posture Scan (Shoulder Tilt)",
        detail: `Shoulder asymmetry: ${ls.shoulderTilt.toFixed(1)}° tilt`,
        timestamp: "Recent Scan",
      });
    }
    if (ls.hipTilt && ls.hipTilt > 2) {
      const intensity = Math.min(1.0, (ls.hipTilt / 9));
      sources.push({
        id: "scan-hip",
        region: "left_hip",
        intensity,
        radius: 0.30,
        source: "postureScan",
        label: "Posture Scan (Pelvic Tilt)",
        detail: `Pelvic asymmetry: ${ls.hipTilt.toFixed(1)}° tilt`,
        timestamp: "Recent Scan",
      });
      sources.push({
        id: "scan-lumbar",
        region: "lumbar",
        intensity: Math.min(1.0, intensity * 1.1),
        radius: 0.35,
        source: "postureScan",
        label: "Posture Scan (Lumbar Load)",
        detail: `Compensatory lumbar load from ${ls.hipTilt.toFixed(1)}° pelvic tilt`,
        timestamp: "Recent Scan",
      });
    }
    if (ls.headForward && ls.headForward > 2) {
      const intensity = Math.min(1.0, (ls.headForward / 8));
      sources.push({
        id: "scan-neck",
        region: "neck",
        intensity,
        radius: 0.24,
        source: "postureScan",
        label: "Posture Scan (Head Forward Shift)",
        detail: `Forward head displacement: ${ls.headForward.toFixed(1)} cm`,
        timestamp: "Recent Scan",
      });
    }
    if (ls.rom && (ls.rom < 85 || (ls.symmetry && ls.symmetry < 0.9))) {
      const intensity = Math.min(1.0, (1 - (ls.symmetry || 0.95)) * 4 + 0.3);
      sources.push({
        id: "scan-knee",
        region: "left_knee",
        intensity,
        radius: 0.28,
        source: "postureScan",
        label: "Posture Scan (Knee Kinematics)",
        detail: `Range of motion: ${Math.round(ls.rom)}°, Symmetry: ${Math.round((ls.symmetry || 0.95) * 100)}%`,
        timestamp: "Recent Scan",
      });
    }
  }

  // 4. Self-Reported Pain Entries (from direct user tap / self report modal)
  const selfReportMap = options.selfReportedPain || getStoredSelfReportedPain();
  for (const [zoneKey, entry] of Object.entries(selfReportMap)) {
    if (entry && entry.intensity > 0) {
      sources.push({
        id: `self-${zoneKey}`,
        region: zoneKey as ZoneId,
        intensity: entry.intensity,
        radius: 0.30,
        source: "selfReportedPain",
        label: "User Self-Reported Pain",
        detail: `${entry.note || "Direct patient self-reported pain score"} (${Math.round(entry.intensity * 10)}/10)`,
        timestamp: entry.timestamp || "Today",
      });
    }
  }

  return sources;
}

export function getStoredSelfReportedPain(): Record<string, { intensity: number; note?: string; timestamp: string }> {
  try {
    const raw = localStorage.getItem("pt_self_reported_pain");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredSelfReportedPain(zone: ZoneId, intensity: number, note?: string) {
  try {
    const current = getStoredSelfReportedPain();
    current[zone] = {
      intensity: Math.max(0, Math.min(1.0, intensity)),
      note: note || `Pain rating ${Math.round(intensity * 10)}/10`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    localStorage.setItem("pt_self_reported_pain", JSON.stringify(current));
  } catch (e) {
    console.error("Failed saving self-reported pain", e);
  }
}

function mapTextToZoneId(text: string): ZoneId | null {
  const norm = text.toLowerCase();
  if (norm.includes("knee") && norm.includes("right")) return "right_knee";
  if (norm.includes("knee")) return "left_knee";
  if (norm.includes("back") || norm.includes("lumbar")) return "lumbar";
  if (norm.includes("shoulder") && norm.includes("right")) return "right_shoulder";
  if (norm.includes("shoulder")) return "left_shoulder";
  if (norm.includes("hip") && norm.includes("right")) return "right_hip";
  if (norm.includes("hip")) return "left_hip";
  if (norm.includes("neck") || norm.includes("cervical")) return "neck";
  if (norm.includes("ankle")) return "left_ankle";
  if (norm.includes("chest")) return "chest";
  if (norm.includes("head")) return "head";
  return "left_knee";
}
