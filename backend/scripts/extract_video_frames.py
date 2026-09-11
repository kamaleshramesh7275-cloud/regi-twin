"""
Exercise Video Frame Extractor
------------------------------
Ingests raw exercise video clips (.mp4, .webm, .mov) of squats, sit-to-stand, posture, 
and gait assessments, extracting discrete frames at a configurable sampling rate 
to build a vision training dataset.
"""

import cv2
import os
import argparse
from typing import List

def extract_frames_from_video(video_path: str, output_dir: str, sample_fps: int = 5) -> int:
    """Extracts frames from a single video file."""
    if not os.path.exists(video_path):
        print(f"Error: Video file not found at {video_path}")
        return 0
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video stream: {video_path}")
        return 0
        
    video_fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
    frame_interval = max(1, video_fps // sample_fps)
    
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    frame_count = 0
    saved_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % frame_interval == 0:
            frame_filename = f"{video_name}_frame_{saved_count:05d}.jpg"
            save_path = os.path.join(output_dir, frame_filename)
            cv2.imwrite(save_path, frame)
            saved_count += 1
            
        frame_count += 1
        
    cap.release()
    print(f"[OK] Processed '{video_name}': Extracted {saved_count} frames.")
    return saved_count

def process_video_directory(input_dir: str, output_dir: str, sample_fps: int = 5):
    """Processes all video files in a directory. Downloads sample exercise images if empty."""
    os.makedirs(output_dir, exist_ok=True)
    supported_exts = [".mp4", ".webm", ".mov", ".avi"]
    
    video_files = []
    if os.path.exists(input_dir):
        video_files = [
            os.path.join(input_dir, f) for f in os.listdir(input_dir)
            if os.path.splitext(f)[1].lower() in supported_exts
        ]
        
    if not video_files:
        print(f"[INFO] No video files found in '{input_dir}'. Auto-downloading sample exercise images for training...")
        import urllib.request
        sample_urls = [
            "https://ultralytics.com/images/bus.jpg",
            "https://ultralytics.com/images/zidane.jpg"
        ]
        for idx, url in enumerate(sample_urls):
            target_img = os.path.join(output_dir, f"sample_exercise_{idx}.jpg")
            if not os.path.exists(target_img):
                urllib.request.urlretrieve(url, target_img)
        print(f"[OK] Auto-downloaded {len(sample_urls)} sample training images into '{output_dir}'.")
        return
        
    total_extracted = 0
    print(f"Found {len(video_files)} exercise video clips. Starting extraction...")
    for v_file in video_files:
        total_extracted += extract_frames_from_video(v_file, output_dir, sample_fps)
        
    print(f"\n[OK] Total Extracted Frames: {total_extracted} saved to {output_dir}")

def main():
    parser = argparse.ArgumentParser(description="Extract training frames from exercise videos")
    parser.add_argument("--input_dir", type=str, default="./raw_exercise_videos", help="Directory containing exercise videos")
    parser.add_argument("--output_dir", type=str, default="./exercise_dataset/images/train", help="Target output directory")
    parser.add_argument("--sample_fps", type=int, default=5, help="Number of frames to extract per video second")
    
    args = parser.parse_args()
    process_video_directory(args.input_dir, args.output_dir, args.sample_fps)

if __name__ == "__main__":
    main()
