import os
import urllib.request
import shutil
from ultralytics import YOLO

def main():
    print("Step 1: Setting up dataset directories...")
    dataset_dir = os.path.abspath("toy_dataset")
    images_dir = os.path.join(dataset_dir, "images", "train")
    labels_dir = os.path.join(dataset_dir, "labels", "train")
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)
    
    # Validation dirs (we use same for this toy example)
    val_images_dir = os.path.join(dataset_dir, "images", "val")
    val_labels_dir = os.path.join(dataset_dir, "labels", "val")
    os.makedirs(val_images_dir, exist_ok=True)
    os.makedirs(val_labels_dir, exist_ok=True)

    print("Step 2: Downloading sample 'squat' images...")
    urls = [
        "https://ultralytics.com/images/bus.jpg",
        "https://ultralytics.com/images/zidane.jpg"
    ]
    
    for i, url in enumerate(urls):
        img_path = os.path.join(images_dir, f"img_{i}.jpg")
        if not os.path.exists(img_path):
            urllib.request.urlretrieve(url, img_path)
            # Copy to val as well
            shutil.copy(img_path, os.path.join(val_images_dir, f"img_{i}.jpg"))

    print("Step 3: Auto-Annotating with Teacher Model (YOLOv8n-pose)...")
    teacher = YOLO("yolov8n-pose.pt")
    
    for i in range(len(urls)):
        img_path = os.path.join(images_dir, f"img_{i}.jpg")
        results = teacher(img_path)
        
        # Write labels to txt
        label_path = os.path.join(labels_dir, f"img_{i}.txt")
        val_label_path = os.path.join(val_labels_dir, f"img_{i}.txt")
        
        with open(label_path, "w") as f, open(val_label_path, "w") as vf:
            for r in results:
                for box, keypoints in zip(r.boxes, r.keypoints):
                    cls = int(box.cls[0])
                    # YOLO format: class x_center y_center width height px1 py1 ... px17 py17
                    x, y, w, h = box.xywhn[0]
                    line = f"{cls} {x:.5f} {y:.5f} {w:.5f} {h:.5f}"
                    
                    if keypoints.xyn is not None:
                        for kpt in keypoints.xyn[0]:
                            kx, ky = kpt
                            line += f" {kx:.5f} {ky:.5f} 2.0" # 2.0 = visible
                    
                    f.write(line + "\n")
                    vf.write(line + "\n")

    print("Step 4: Creating Dataset Config YAML...")
    yaml_path = os.path.join(dataset_dir, "toy_pose.yaml")
    yaml_content = f"""path: {dataset_dir}
train: images/train
val: images/val
kpt_shape: [17, 3]
names:
  0: person
"""
    with open(yaml_path, "w") as f:
        f.write(yaml_content)

    print("Step 5: Training Student Model (Transfer Learning)...")
    student = YOLO("yolov8n-pose.pt")
    # Train for just 1 epoch to prove it works
    student.train(data=yaml_path, epochs=1, imgsz=640, device="cpu", project="runs", name="toy_finetune")
    
    print("Step 6: Exporting Final Model to ONNX...")
    best_weights = os.path.abspath("runs/toy_finetune/weights/best.pt")
    final_model = YOLO(best_weights)
    onnx_path = final_model.export(format="onnx", imgsz=640, opset=12, simplify=True)
    
    # Move to frontend
    target_path = os.path.abspath("../../frontend/public/model.onnx")
    shutil.copy(onnx_path, target_path)
    print(f"Pipeline Complete! ONNX model deployed to {target_path}")

if __name__ == "__main__":
    main()
