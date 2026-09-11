"""
ONNX Web Runtime Exporter
-------------------------
Exports trained YOLO Pose models into ONNX format optimized for web browser 
execution via `onnxruntime-web` (WASM / WebGL).

Automatically copies the exported ONNX model to `frontend/public/model.onnx`.
"""

import os
import shutil
import argparse
from ultralytics import YOLO

def export_to_onnx_web(pt_model_path: str, web_target_path: str):
    """Exports PyTorch YOLO pose model to ONNX format and deploys to frontend."""
    if not os.path.exists(pt_model_path):
        print(f"Error: PyTorch model weights file '{pt_model_path}' not found.")
        print("Falling back to default 'yolov8n-pose.pt'...")
        pt_model_path = "yolov8n-pose.pt"
        
    print(f"Loading model '{pt_model_path}' for ONNX Web export...")
    model = YOLO(pt_model_path)
    
    print("Exporting ONNX model (opset 12, simplified)...")
    # Export model to ONNX with opset 12 for best onnxruntime-web WASM compatibility
    onnx_path = model.export(
        format="onnx",
        imgsz=640,
        opset=12,
        simplify=True,
        dynamic=False
    )
    
    print(f"[OK] ONNX model successfully generated at: {onnx_path}")
    
    # Ensure frontend/public directory exists
    target_dir = os.path.dirname(os.path.abspath(web_target_path))
    os.makedirs(target_dir, exist_ok=True)
    
    print(f"Deploying model to frontend public assets: '{web_target_path}'...")
    shutil.copy(onnx_path, web_target_path)
    print(f"\n[OK] Deployment Successful! Web app ready to load pose model natively in browser.")

def main():
    parser = argparse.ArgumentParser(description="Export YOLO Pose model to ONNX for Web Deployment")
    parser.add_argument("--weights", type=str, default="runs/pose/clinical_finetune/weights/best.pt", help="Path to trained .pt weights")
    parser.add_argument("--target", type=str, default="../../frontend/public/model.onnx", help="Target ONNX path in frontend public folder")
    
    args = parser.parse_args()
    target_abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), args.target))
    export_to_onnx_web(args.weights, target_abs_path)

if __name__ == "__main__":
    main()
