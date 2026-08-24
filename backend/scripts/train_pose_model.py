import os
from ultralytics import YOLO

def main():
    print("Initializing YOLOv8-Pose for Transfer Learning...")
    
    # Load a pretrained YOLOv8 pose model (nano version is best for web/real-time)
    # This automatically downloads 'yolov8n-pose.pt' if not present
    model = YOLO("yolov8n-pose.pt")
    
    # Path to the data configuration file. 
    # This file should define the paths to your 200-500 curated images and labels.
    # Format: Ultralytics Pose Dataset format (YAML)
    dataset_yaml = os.path.abspath("custom_pose_data.yaml")
    
    if not os.path.exists(dataset_yaml):
        print(f"Error: Dataset config '{dataset_yaml}' not found.")
        print("Please create this YAML file pointing to your curated clinical images.")
        print("Example content:")
        print("path: ./datasets/clinical_pose")
        print("train: images/train")
        print("val: images/val")
        print("kpt_shape: [17, 3]  # 17 keypoints (x, y, visibility)")
        print("names: [0: 'person']")
        return

    print("Starting fine-tuning...")
    # Train the model
    # We use a low number of epochs for our light-data approach
    results = model.train(
        data=dataset_yaml,
        epochs=50,
        imgsz=640,
        batch=16,
        device="cpu", # Change to "0" if running on a machine with an NVIDIA GPU
        project="runs/pose",
        name="clinical_finetune"
    )
    
    print("Training complete!")
    
    # Export the best trained model to ONNX format for web deployment
    print("Exporting model to ONNX...")
    best_model_path = "runs/pose/clinical_finetune/weights/best.pt"
    if os.path.exists(best_model_path):
        trained_model = YOLO(best_model_path)
        # Export with opset 12 or 13 for best onnxruntime-web compatibility
        onnx_path = trained_model.export(format="onnx", imgsz=640, opset=12, simplify=True)
        print(f"Exported ONNX model successfully to: {onnx_path}")
        print("Copy this .onnx file to frontend/public/ to use it in the web app!")
    else:
        print("Failed to find the trained weights for export.")

if __name__ == "__main__":
    main()
