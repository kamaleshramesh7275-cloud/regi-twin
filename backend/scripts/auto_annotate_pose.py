"""
Automated Pose Keypoint Teacher Auto-Annotator
----------------------------------------------
Runs a high-accuracy Teacher Model (YOLOv8 Pose) over raw exercise images to 
automatically generate YOLO Pose annotations (.txt files) containing 17 skeleton keypoints 
(x_center, y_center, width, height, px1, py1, vis1, ..., px17, py17, vis17).
"""

import os
import argparse
from ultralytics import YOLO

def auto_annotate_dataset(images_dir: str, labels_dir: str, teacher_model_name: str = "yolov8x-pose.pt"):
    """Auto-annotates image dataset using a teacher pose model."""
    os.makedirs(labels_dir, exist_ok=True)
    
    print(f"Loading Teacher Model '{teacher_model_name}'...")
    teacher = YOLO(teacher_model_name)
    
    image_extensions = [".jpg", ".jpeg", ".png"]
    image_files = [
        f for f in os.listdir(images_dir)
        if os.path.splitext(f)[1].lower() in image_extensions
    ]
    
    if not image_files:
        print(f"No image files found in {images_dir}.")
        return
        
    print(f"Auto-annotating {len(image_files)} exercise images...")
    annotated_count = 0
    
    for img_file in image_files:
        img_path = os.path.join(images_dir, img_file)
        results = teacher(img_path, verbose=False)
        
        label_filename = os.path.splitext(img_file)[0] + ".txt"
        label_path = os.path.join(labels_dir, label_filename)
        
        lines = []
        for r in results:
            if r.boxes is not None and r.keypoints is not None:
                for box, keypoints in zip(r.boxes, r.keypoints):
                    cls = int(box.cls[0])
                    # Bounding box in normalized xywh format
                    x, y, w, h = box.xywhn[0].tolist()
                    line = f"{cls} {x:.5f} {y:.5f} {w:.5f} {h:.5f}"
                    
                    # 17 Keypoints in normalized format (x, y, visibility)
                    if keypoints.xyn is not None:
                        for kpt in keypoints.xyn[0]:
                            kx, ky = kpt.tolist()
                            vis = 2.0 if (kx > 0 and ky > 0) else 0.0 # 2.0 = visible
                            line += f" {kx:.5f} {ky:.5f} {vis:.1f}"
                            
                    lines.append(line)
                    
        with open(label_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
            
        annotated_count += 1
        
    print(f"[OK] Successfully generated {annotated_count} YOLO Pose label files in '{labels_dir}'!")

def main():
    parser = argparse.ArgumentParser(description="Auto-annotate exercise images for pose estimation")
    parser.add_argument("--images_dir", type=str, default="./exercise_dataset/images/train", help="Directory with images")
    parser.add_argument("--labels_dir", type=str, default="./exercise_dataset/labels/train", help="Target labels directory")
    parser.add_argument("--teacher_model", type=str, default="yolov8x-pose.pt", help="Teacher model name")
    
    args = parser.parse_args()
    auto_annotate_dataset(args.images_dir, args.labels_dir, args.teacher_model)

if __name__ == "__main__":
    main()
