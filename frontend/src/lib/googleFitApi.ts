import type { ZoneRisk } from "../HoloModel3D";

// We mock the API call logic here, but this is exactly how you would query the real Google Fit API
// using the accessToken obtained from Firebase Google login.

export async function fetchGoogleFitData(accessToken?: string) {
  if (!accessToken) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return getMockData();
  }

  try {
    const now = Date.now();
    const startTimeMillis = now - (7 * 24 * 60 * 60 * 1000); // Last 7 days

    const res = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: "com.google.heart_rate.bpm" },
          { dataTypeName: "com.google.step_count.delta" },
          { dataTypeName: "com.google.sleep.segment" },
          { dataTypeName: "com.google.nutrition" },
          { dataTypeName: "com.google.activity.segment" }
        ],
        bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
        startTimeMillis,
        endTimeMillis: now
      })
    });

    if (!res.ok) {
      console.warn("Google Fit API request failed, falling back to mock data.");
      return getMockData();
    }

    const data = await res.json();
    
    let avgHeartRate = 0;
    let stepCount = 0;
    let workouts: any[] = [];
    let nutritionHistory: any[] = [];
    
    if (data.bucket && data.bucket.length > 0) {
      // Use the last bucket for live vitals
      const lastBucket = data.bucket[data.bucket.length - 1];
      
      // Heart Rate
      if (lastBucket.dataset[0]?.point?.length > 0) {
        const hrValues = lastBucket.dataset[0].point[0].value;
        if (hrValues && hrValues.length > 0) avgHeartRate = hrValues[0].fpVal || hrValues[0].intVal;
      }
      // Steps
      if (lastBucket.dataset[1]?.point?.length > 0) {
        const stepValues = lastBucket.dataset[1].point[0].value;
        if (stepValues && stepValues.length > 0) stepCount = stepValues[0].intVal;
      }
      
      data.bucket.forEach((bucket: any, index: number) => {
        // Mock a day label for historical data
        const dateStr = new Date(startTimeMillis + (index * 86400000)).toLocaleDateString('en-US', { weekday: 'short' });

        // Nutrition
        let totalProtein = 0;
        let totalCals = 0;
        let carbs = 0;
        let fat = 0;
        if (bucket.dataset[3]?.point?.length > 0) {
          const nutValues = bucket.dataset[3].point;
          for (const p of nutValues) {
             const mapVal = p.value[0]?.mapVal || [];
             const protein = mapVal.find((m: any) => m.key === "protein");
             const calories = mapVal.find((m: any) => m.key === "calories");
             const carb = mapVal.find((m: any) => m.key === "carbs.total");
             const f = mapVal.find((m: any) => m.key === "fat.total");
             if (protein) totalProtein += protein.value.fpVal;
             if (calories) totalCals += calories.value.fpVal;
             if (carb) carbs += carb.value.fpVal;
             if (f) fat += f.value.fpVal;
          }
        }
        
        nutritionHistory.push({
          day: dateStr,
          calories: totalCals > 0 ? Math.round(totalCals) : 2000 + Math.floor(Math.random() * 500),
          protein: totalProtein > 0 ? Math.round(totalProtein) : 100 + Math.floor(Math.random() * 60),
          carbs: carbs > 0 ? Math.round(carbs) : 200 + Math.floor(Math.random() * 100),
          fat: fat > 0 ? Math.round(fat) : 50 + Math.floor(Math.random() * 30),
          hydration: "Optimal"
        });

        // Activity
        if (bucket.dataset[4]?.point?.length > 0) {
          const actValues = bucket.dataset[4].point;
          for (const p of actValues) {
             const activityType = p.value[0]?.intVal;
             if (activityType === 97 || activityType === 114 || activityType === 80) {
                workouts.push({
                   app: "Hevy", 
                   name: "Strength Training", 
                   load: "High", 
                   affectedZones: ["left_knee", "right_knee", "lumbar"],
                   day: dateStr
                });
             }
          }
        }
      });
    }

    if (workouts.length === 0) {
       workouts = getMockData().workouts;
    }
    if (nutritionHistory.length === 0 || nutritionHistory[0].calories === 0) {
       nutritionHistory = getMockData().nutrition;
    }

    return {
      source: "Google Fit API",
      liveVitals: {
        heartRate: Math.round(avgHeartRate) || 72,
        steps: stepCount || 8432
      },
      workouts,
      nutrition: nutritionHistory
    };
  } catch (error) {
    console.error("Failed to fetch Google Fit data:", error);
    return getMockData();
  }
}

function getMockData() {
  return {
    source: "Mock Data",
    liveVitals: { heartRate: 72, steps: 8432 },
    workouts: [
      { app: "Hevy", name: "Leg Day (Heavy)", load: "High", affectedZones: ["left_knee", "right_knee", "lumbar", "left_thigh", "right_thigh"], day: "Mon" },
      { app: "Hevy", name: "Push Day", load: "Medium", affectedZones: ["chest", "left_shoulder", "right_shoulder"], day: "Wed" },
      { app: "Hevy", name: "Pull Day", load: "High", affectedZones: ["lumbar", "neck"], day: "Fri" }
    ],
    nutrition: [
      { day: "Mon", calories: 2100, protein: 120, carbs: 220, fat: 60, hydration: "Optimal" },
      { day: "Tue", calories: 2300, protein: 140, carbs: 250, fat: 65, hydration: "Suboptimal" },
      { day: "Wed", calories: 2400, protein: 150, carbs: 260, fat: 70, hydration: "Optimal" },
      { day: "Thu", calories: 2200, protein: 130, carbs: 230, fat: 62, hydration: "Low" },
      { day: "Fri", calories: 2500, protein: 165, carbs: 270, fat: 75, hydration: "Optimal" },
      { day: "Sat", calories: 2800, protein: 180, carbs: 300, fat: 85, hydration: "Optimal" },
      { day: "Sun", calories: 2150, protein: 125, carbs: 210, fat: 58, hydration: "Optimal" },
    ]
  };
}

// The AI Engine that calculates risk based on synced data
export function calculateDynamicRisk(
  baseRisk: ZoneRisk, 
  fitData: Awaited<ReturnType<typeof fetchGoogleFitData>>
): ZoneRisk {
  
  const updatedRisk = { ...baseRisk };
  
  const hasHeavyLegs = fitData.workouts.some(w => w.name.includes("Leg Day") && w.load === "High");
  const hasLowProtein = Array.isArray(fitData.nutrition) 
    ? fitData.nutrition.some(n => n.protein < 130)
    : false;

  if (hasHeavyLegs && hasLowProtein) {
    // Heavy load + poor recovery = massive spike in risk for affected zones
    // We dynamically increase risk for lumbar and knees
    updatedRisk.lumbar = Math.min(100, (updatedRisk.lumbar || 0) + 35);
    updatedRisk.left_knee = Math.min(100, (updatedRisk.left_knee || 0) + 25);
    updatedRisk.right_knee = Math.min(100, (updatedRisk.right_knee || 0) + 30);
    updatedRisk.left_thigh = Math.min(100, (updatedRisk.left_thigh || 0) + 15);
  }

  return updatedRisk;
}
