import requests
import json

BASE_URL = "http://localhost:8000"

def test_capture_to_twin():
    print("Step 1: Submitting realistic kinematic capture session for 'demo_user'...")
    payload = {
        "user_id": "demo_user",
        "task_type": "Standing-Posture",
        "pose_landmarks_json": "{}",
        "joint_angles_json": json.dumps({
            "Shoulder Tilt": 6.8,
            "Hip Tilt": 8.5,
            "Head Forward": 11.2,
            "Knee Valgus": 7.4,
            "Symmetry": 0.88
        }),
        "rom": 175.0,
        "movement_speed": 0.0,
        "symmetry": 0.88,
        "stability": 0.76,
        "camera_quality": "High",
        "kinematics": []
    }
    
    res = requests.post(f"{BASE_URL}/sessions/vision", json=payload)
    print(f"Session submission status: {res.status_code}, response: {res.json()}")
    assert res.status_code == 200
    
    print("\nStep 2: Fetching updated Digital Twin dashboard...")
    res_dash = requests.get(f"{BASE_URL}/analytics/dashboard/demo_user")
    assert res_dash.status_code == 200
    dash = res_dash.json()
    
    zone_risks = dash.get("zone_risks", {})
    print(f"Computed Zone Risks for 3D Twin:\n{json.dumps(zone_risks, indent=2)}")
    
    # Assert that captured deviations reflected accurately
    assert zone_risks["neck"] >= 50, f"Expected neck risk >= 50, got {zone_risks.get('neck')}"
    assert zone_risks["lumbar"] >= 60, f"Expected lumbar risk >= 60, got {zone_risks.get('lumbar')}"
    assert zone_risks["left_knee"] >= 50, f"Expected left_knee risk >= 50, got {zone_risks.get('left_knee')}"
    assert zone_risks["left_shoulder"] >= 45, f"Expected left_shoulder risk >= 45, got {zone_risks.get('left_shoulder')}"
    
    print("\nSUCCESS! Capture kinematics directly reflected on the Digital Twin zone risks!")

if __name__ == "__main__":
    test_capture_to_twin()
