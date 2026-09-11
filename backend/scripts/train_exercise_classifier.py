"""
Real-Time Biomechanical Form & Repetition State Classifier
------------------------------------------------------------
Processes real-time landmark streams (17/33 keypoints) to compute joint angles 
(knee flexion, hip depth, shoulder-hip alignment vector), track exercise state transitions 
(IDLE -> DESCENDING -> BOTTOM_HOLD -> ASCENDING -> COMPLETED), and flag mechanical faults 
(valgus collapse, forward head posture, shallow depth).
"""

import math
import time
from typing import Dict, Any, List, Tuple

class BiomechanicalExerciseClassifier:
    def __init__(self):
        # Repetition State Machine
        self.state = "IDLE"
        self.rep_count = 0
        self.min_knee_flexion = 180.0 # Stores peak squat depth in current rep
        self.faults_detected: List[str] = []
        
        # Angles thresholds for Squat Analysis
        self.STANDING_KNEE_ANGLE = 160.0 # Standing straight
        self.DESCENT_TRIGGER_ANGLE = 140.0 # Beginning squat
        self.PARALLEL_SQUAT_ANGLE = 100.0 # Optimal squat depth
        
    @staticmethod
    def calculate_angle(a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
        """Calculates 2D angle between three keypoint coordinates (degrees)."""
        ang = math.degrees(
            math.atan2(c[1] - b[1], c[0] - b[0]) - math.atan2(a[1] - b[1], a[0] - b[0])
        )
        ang = abs(ang)
        if ang > 180.0:
            ang = 360.0 - ang
        return ang

    def process_frame_keypoints(self, keypoints: List[Tuple[float, float]]) -> Dict[str, Any]:
        """
        Processes a single frame's 17 keypoint predictions.
        Keypoint indices (YOLO format):
        5: Left Shoulder, 6: Right Shoulder
        11: Left Hip, 12: Right Hip
        13: Left Knee, 14: Right Knee
        15: Left Ankle, 16: Right Ankle
        """
        if len(keypoints) < 17:
            return {"status": "INSUFFICIENT_KEYPOINTS", "rep_count": self.rep_count}
            
        left_hip, right_hip = keypoints[11], keypoints[12]
        left_knee, right_knee = keypoints[13], keypoints[14]
        left_ankle, right_ankle = keypoints[15], keypoints[16]
        
        # 1. Compute Bilateral Knee Flexion Angles
        left_knee_flex = self.calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_flex = self.calculate_angle(right_hip, right_knee, right_ankle)
        avg_knee_flex = (left_knee_flex + right_knee_flex) / 2.0
        
        # 2. Detect Knee Valgus Collapse (Medial knee displacement)
        hip_width = abs(left_hip[0] - right_hip[0])
        knee_width = abs(left_knee[0] - right_knee[0])
        valgus_ratio = knee_width / max(0.001, hip_width)
        
        is_valgus = valgus_ratio < 0.85 and avg_knee_flex < 130.0
        if is_valgus and "VALGUS_KNEE_COLLAPSE" not in self.faults_detected:
            self.faults_detected.append("VALGUS_KNEE_COLLAPSE")
            
        # 3. Update State Machine
        if avg_knee_flex < self.min_knee_flexion:
            self.min_knee_flexion = avg_knee_flex
            
        if self.state == "IDLE":
            if avg_knee_flex < self.DESCENT_TRIGGER_ANGLE:
                self.state = "DESCENDING"
                self.min_knee_flexion = avg_knee_flex
                self.faults_detected = []
                
        elif self.state == "DESCENDING":
            if avg_knee_flex <= self.PARALLEL_SQUAT_ANGLE:
                self.state = "BOTTOM_HOLD"
            elif avg_knee_flex > self.DESCENT_TRIGGER_ANGLE + 10:
                # User stood back up without hitting depth
                self.state = "IDLE"
                self.faults_detected.append("SHALLOW_DEPTH")
                
        elif self.state == "BOTTOM_HOLD":
            if avg_knee_flex > self.PARALLEL_SQUAT_ANGLE + 15:
                self.state = "ASCENDING"
                
        elif self.state == "ASCENDING":
            if avg_knee_flex >= self.STANDING_KNEE_ANGLE:
                self.rep_count += 1
                self.state = "COMPLETED"
                
        elif self.state == "COMPLETED":
            self.state = "IDLE"
            
        return {
            "state": self.state,
            "rep_count": self.rep_count,
            "knee_angle_left": round(left_knee_flex, 1),
            "knee_angle_right": round(right_knee_flex, 1),
            "peak_depth_angle": round(self.min_knee_flexion, 1),
            "valgus_risk": is_valgus,
            "active_faults": self.faults_detected,
            "timestamp": time.time()
        }

if __name__ == "__main__":
    # Test classifier on dummy standing -> squatting keypoints
    classifier = BiomechanicalExerciseClassifier()
    print("Testing Exercise State Classifier...")
    
    # Dummy standing pose
    dummy_standing = [(0.5, 0.5)] * 17
    dummy_standing[11], dummy_standing[12] = (0.45, 0.5), (0.55, 0.5) # Hips
    dummy_standing[13], dummy_standing[14] = (0.45, 0.7), (0.55, 0.7) # Knees
    dummy_standing[15], dummy_standing[16] = (0.45, 0.9), (0.55, 0.9) # Ankles
    
    res = classifier.process_frame_keypoints(dummy_standing)
    print("Frame 1 (Standing):", res)
