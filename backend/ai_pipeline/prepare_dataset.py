"""
Dataset Preparation Script for PhysioTwin LLM Fine-Tuning (SFT & DPO)
-------------------------------------------------------------------
Converts raw biomechanical telemetry, posture diagnostics, and user clinical queries 
into high-density ChatML format JSONL datasets for Supervised Fine-Tuning (Stage 1) 
and Direct Preference Optimization (Stage 2).
"""

import json
import os
from typing import List, Dict, Any

SYSTEM_PROMPT = (
    "You are PhysioTwin AI, an expert biomechanical intelligence and clinical digital twin assistant. "
    "You analyze 33-point pose kinematics, Range of Motion (ROM), Acute-to-Chronic Workload Ratios (ACWR), "
    "and anatomical strain across 20 body zones. Always respond with strict, structured, and clinically sound insights. "
    "When asked for structured JSON output, adhere strictly to the JSON schema without extra commentary."
)

def create_sample_sft_data() -> List[Dict[str, Any]]:
    """Generates synthetic high-density multi-turn training data for SFT."""
    return [
        {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": "Analyze my sit-to-stand posture data: Peak Velocity = 0.85 m/s, Left Knee ROM = 110 deg, Right Knee ROM = 95 deg, ACWR = 1.45. Give a clinical assessment."
                },
                {
                    "role": "assistant",
                    "content": (
                        "### 🧬 Biomechanical Assessment & Risk Analysis\n\n"
                        "**1. Kinematic Asymmetry Identified:**\n"
                        "- **Bilateral Knee ROM Delta:** 15° deficit on the Right Knee (110° vs 95°). This indicates significant right quadriceps/patellar restriction or joint stiffness during squatting transitions.\n\n"
                        "**2. Acute-to-Chronic Workload Ratio (ACWR):**\n"
                        "- **Current Value:** 1.45 (Nearing the High Risk threshold of 1.50).\n"
                        "- **Clinical Warning:** Mechanical loading has spiked significantly over chronic baseline. Rapid load progression paired with right-side joint deficit elevates injury risk for patellofemoral pain syndrome.\n\n"
                        "**3. Corrective Action Plan:**\n"
                        "- Reduce high-impact bilateral lower body loading by 20% for 3 days.\n"
                        "- Incorporate right-side eccentric goblet box squats (3 sets of 8 reps) and ankle dorsiflexion mobility drills."
                    )
                }
            ]
        },
        {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": "Generate a JSON anatomical strain update for a user reporting acute lumbar pain after heavy deadlifts with forward spinal flex."
                },
                {
                    "role": "assistant",
                    "content": json.dumps({
                        "assessment_type": "lumbar_strain_alert",
                        "primary_affected_zones": ["lumbar_spine", "cervical_spine"],
                        "strain_score": 88,
                        "risk_level": "high",
                        "biomechanical_cause": "Hyper-flexion under compressive sagittal axial load",
                        "zone_updates": {
                            "lumbar_spine": {"strain_level": "red", "value": 0.88},
                            "left_hip": {"strain_level": "yellow", "value": 0.55},
                            "right_hip": {"strain_level": "yellow", "value": 0.52}
                        },
                        "recommended_protocol": [
                            "Immediate cessation of spinal loading exercises",
                            "Decompression positioning (McKenzie extension press-ups)",
                            "Magnesium & hydration recovery tracking"
                        ]
                    }, indent=2)
                }
            ]
        }
    ]

def create_sample_dpo_data() -> List[Dict[str, Any]]:
    """Generates synthetic preference data (chosen vs rejected) for Stage 2 DPO alignment."""
    return [
        {
            "prompt": "User query: My right knee aches during deep squats. ACWR is 1.62. Should I keep squatting heavy today?",
            "chosen": (
                "### ⚠️ Contraindication Alert: High Mechanical Risk\n\n"
                "**Recommendation: DO NOT squat heavy today.**\n\n"
                "**Clinical Rationale:**\n"
                "1. **ACWR Spike (1.62):** Your workload ratio exceeds the critical danger boundary of 1.50, indicating acute fatigue and high tissue micro-trauma risk.\n"
                "2. **Symptom Correlation:** Right knee pain under peak flexion indicates overload on the patellar tendon or articular cartilage.\n\n"
                "**Alternative Protocol:** Switch to low-impact recovery (20 mins zone 2 stationary cycling) and foam rolling on quadriceps."
            ),
            "rejected": (
                "Sure! Pain is just weakness leaving the body! Push through the pain and do 5 more heavy sets of squats. "
                "Maybe add some heavy leg extensions afterwards to build muscle strength!"
            )
        },
        {
            "prompt": "Format JSON status for shoulder impingement detection: Left shoulder ROM = 120 deg.",
            "chosen": json.dumps({
                "joint": "left_shoulder",
                "rom_degrees": 120,
                "normative_baseline": 180,
                "deficit_percentage": 33.3,
                "clinical_impression": "Subacromial space restriction",
                "status": "warning"
            }),
            "rejected": "Left shoulder ROM is 120 degrees which is less than 180 degrees. You might have shoulder impingement. Here is some text instead of JSON."
        }
    ]

def main():
    output_dir = os.path.abspath(os.path.dirname(__file__))
    os.makedirs(output_dir, exist_ok=True)
    
    sft_path = os.path.join(output_dir, "dataset_sft.jsonl")
    dpo_path = os.path.join(output_dir, "dataset_dpo.jsonl")
    
    print(f"Generating SFT dataset at {sft_path}...")
    sft_data = create_sample_sft_data()
    with open(sft_path, "w", encoding="utf-8") as f:
        for item in sft_data:
            f.write(json.dumps(item) + "\n")
    print(f"[OK] SFT dataset generated ({len(sft_data)} entries).")
    
    print(f"Generating DPO preference dataset at {dpo_path}...")
    dpo_data = create_sample_dpo_data()
    with open(dpo_path, "w", encoding="utf-8") as f:
        for item in dpo_data:
            f.write(json.dumps(item) + "\n")
    print(f"[OK] DPO dataset generated ({len(dpo_data)} entries).")

if __name__ == "__main__":
    main()
