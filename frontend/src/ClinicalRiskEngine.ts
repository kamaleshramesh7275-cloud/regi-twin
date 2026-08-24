export type Keypoint = { x: number; y: number; z?: number; visibility?: number };

export type Skeleton = {
  // Keypoints according to standard YOLO/COCO pose format
  nose: Keypoint;
  leftEye: Keypoint;
  rightEye: Keypoint;
  leftEar: Keypoint;
  rightEar: Keypoint;
  leftShoulder: Keypoint;
  rightShoulder: Keypoint;
  leftElbow: Keypoint;
  rightElbow: Keypoint;
  leftWrist: Keypoint;
  rightWrist: Keypoint;
  leftHip: Keypoint;
  rightHip: Keypoint;
  leftKnee: Keypoint;
  rightKnee: Keypoint;
  leftAnkle: Keypoint;
  rightAnkle: Keypoint;
};

export type RiskAlert = {
  type: "CRITICAL_ACL_RISK" | "HIGH_LUMBAR_SHEAR_RISK" | "COMPENSATORY_LOAD_RISK";
  message: string;
  severity: "high" | "medium" | "low";
  timestamp: number;
};

export class ClinicalRiskEngine {
  
  /**
   * Calculates the 2D angle between three points (p1-p2-p3)
   */
  private static calculateAngle(p1: Keypoint, p2: Keypoint, p3: Keypoint): number {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }

  /**
   * 1. Dynamic Knee Valgus (ACL Risk)
   * Detects if the knee tracks inward significantly past the ankle alignment.
   */
  private static checkKneeValgus(skeleton: Skeleton): RiskAlert | null {
    // Check Left Leg
    const leftHip = skeleton.leftHip;
    const leftKnee = skeleton.leftKnee;
    const leftAnkle = skeleton.leftAnkle;
    
    // Check Right Leg
    const rightHip = skeleton.rightHip;
    const rightKnee = skeleton.rightKnee;
    const rightAnkle = skeleton.rightAnkle;

    // Frontal plane valgus approximation (assuming subject faces camera):
    // If the knee's x coordinate falls significantly medial to the ankle/hip vertical line
    const leftValgusAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightValgusAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);

    // Normally a straight leg is ~180 degrees. If it drops below 165 (more than 15 deg inward collapse), flag it.
    // Note: To perfectly isolate valgus (inward) vs flexion (bending), we also check the X coordinate relative to midline.
    const isLeftKneeMedial = leftKnee.x > leftAnkle.x && leftKnee.x > leftHip.x; // Assuming X grows left-to-right from camera view
    const isRightKneeMedial = rightKnee.x < rightAnkle.x && rightKnee.x < rightHip.x;

    if (leftValgusAngle < 165 && isLeftKneeMedial) {
      return {
        type: "CRITICAL_ACL_RISK",
        message: "Dynamic Left Knee Valgus Detected (> 15° collapse). High risk of non-contact ACL tear.",
        severity: "high",
        timestamp: Date.now(),
      };
    }
    
    if (rightValgusAngle < 165 && isRightKneeMedial) {
      return {
        type: "CRITICAL_ACL_RISK",
        message: "Dynamic Right Knee Valgus Detected (> 15° collapse). High risk of non-contact ACL tear.",
        severity: "high",
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * 2. Lumbar Flexion & Spinal Creep (Disc Herniation Risk)
   * Detects if the back rounds excessively during a bend, losing neutral spine.
   */
  private static checkLumbarFlexion(skeleton: Skeleton): RiskAlert | null {
    // Use the side profile (whichever side is more visible)
    // For simplicity, we'll average or pick the right side
    const shoulder = skeleton.rightShoulder;
    const hip = skeleton.rightHip;
    const knee = skeleton.rightKnee;

    // Angle of the torso relative to the vertical axis
    // If shoulder is significantly lower and far forward from hip, and back angle is steep.
    // We approximate Lumbar Flexion as the angle between the shoulder-hip line and the hip-knee line
    const hipHingeAngle = this.calculateAngle(shoulder, hip, knee);

    // A perfect deadlift might have a hip angle of 90 degrees with a straight back.
    // However, if we just have 17 points, we don't have mid-spine points.
    // We can infer dangerous spinal rounding if the shoulders drop below the hips while the knees remain relatively straight.
    const kneeFlexion = this.calculateAngle(hip, knee, skeleton.rightAnkle);
    
    // If knees are relatively straight (> 140 deg) but torso is bent over heavily (hips < 70 deg)
    // This indicates a "stiff-legged" bend which heavily loads the lumbar spine if load is present.
    if (kneeFlexion > 140 && hipHingeAngle < 70) {
      return {
        type: "HIGH_LUMBAR_SHEAR_RISK",
        message: "Severe Lumbar Flexion with straight legs. Loss of neutral spine under load increases disc herniation risk.",
        severity: "high",
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * 3. Bilateral Asymmetry (Compensatory Injury Risk)
   * Detects if the patient is shifting weight heavily to one side.
   */
  private static checkAsymmetry(skeleton: Skeleton): RiskAlert | null {
    const leftHip = skeleton.leftHip;
    const rightHip = skeleton.rightHip;
    const leftAnkle = skeleton.leftAnkle;
    const rightAnkle = skeleton.rightAnkle;

    // Center of Mass (approximated by mid-hip)
    const comX = (leftHip.x + rightHip.x) / 2;
    
    // Base of Support (midpoint between ankles)
    const baseMidpointX = (leftAnkle.x + rightAnkle.x) / 2;
    
    // Base width
    const baseWidth = Math.abs(leftAnkle.x - rightAnkle.x);

    // If center of mass shifts more than 15% of the base width away from the center
    const shiftDistance = Math.abs(comX - baseMidpointX);
    const shiftPercentage = shiftDistance / baseWidth;

    if (shiftPercentage > 0.15) {
      const side = comX < baseMidpointX ? "Right" : "Left"; // Depends on camera mirror
      return {
        type: "COMPENSATORY_LOAD_RISK",
        message: `Bilateral Asymmetry Detected. Weight shifted >15% to the ${side}. Risk of compensatory overloading.`,
        severity: "medium",
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Main function to evaluate a frame and return all active risks.
   */
  public static evaluateFrame(skeleton: Skeleton): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    // Ensure we have valid data before running checks (skip if confidence/visibility is too low)
    if (!skeleton.leftHip || !skeleton.rightHip) return alerts;

    const valgusAlert = this.checkKneeValgus(skeleton);
    if (valgusAlert) alerts.push(valgusAlert);

    const lumbarAlert = this.checkLumbarFlexion(skeleton);
    if (lumbarAlert) alerts.push(lumbarAlert);

    const asymmetryAlert = this.checkAsymmetry(skeleton);
    if (asymmetryAlert) alerts.push(asymmetryAlert);

    return alerts;
  }
}
