import os
import shutil
import sys

def main():
    pt_path = r"C:\Users\kamal\Downloads\last.pt"
    if not os.path.exists(pt_path):
        print(f"Error: File does not exist at {pt_path}")
        sys.exit(1)
        
    print(f"Found fine-tuned weights at: {pt_path} ({os.path.getsize(pt_path):,} bytes)")
    
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Ultralytics not installed. Please run: pip install ultralytics")
        sys.exit(1)
        
    print("Loading YOLO model...")
    model = YOLO(pt_path)
    
    print("Model details:")
    print(f"  Task: {getattr(model, 'task', 'pose')}")
    if hasattr(model, 'names'):
        print(f"  Classes: {model.names}")
    
    print("\nExporting model to ONNX format (imgsz=640, opset=12, simplify=True)...")
    exported_onnx_path = model.export(format="onnx", imgsz=640, opset=12, simplify=True)
    print(f"Successfully exported to: {exported_onnx_path}")
    
    # Destination in frontend/public/model.onnx
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    target_path = os.path.join(project_root, "frontend", "public", "model.onnx")
    backup_path = os.path.join(project_root, "frontend", "public", "model_backup.onnx")
    
    if os.path.exists(target_path):
        shutil.copyfile(target_path, backup_path)
        print(f"Backed up previous model to {backup_path}")
        
    shutil.copyfile(exported_onnx_path, target_path)
    print(f"Deployed new fine-tuned model to: {target_path} ({os.path.getsize(target_path):,} bytes)")
    print("\nFine-tuned CV Model is ready for in-browser deployment!")

if __name__ == "__main__":
    main()
