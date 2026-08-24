# Custom Pose Model Training

This directory contains the scripts necessary to train and export a fine-tuned computer vision model for pose estimation.

## Prerequisites

You'll need a Python environment with the `ultralytics` package installed:

```bash
pip install ultralytics
```

## Step 1: Collect Data
Gather 200-500 images of the specific poses (squats, rehab movements) where the current MediaPipe model struggles.

## Step 2: Annotate Data
Use a free tool like [CVAT](https://cvat.ai/) or Roboflow to annotate your 17 keypoints for the human skeleton. Export the dataset in **YOLOv8 Pose format**.

## Step 3: Setup Dataset Config
Extract your dataset into this folder (or nearby) and create a `custom_pose_data.yaml` file in this `scripts` directory with the following structure:

```yaml
path: ./datasets/clinical_pose # path to your dataset
train: images/train            # train images (relative to 'path')
val: images/val                # val images (relative to 'path')

# Keypoints
kpt_shape: [17, 3] # 17 keypoints (x, y, visible)
names:
  0: person
```

## Step 4: Run Training
Run the fine-tuning script. This will download the base YOLOv8n-pose model, train it on your data, and export it to an ONNX file.

```bash
python train_pose_model.py
```

## Step 5: Deploy
Once training is complete, an ONNX file will be generated (e.g., `runs/pose/clinical_finetune/weights/best.onnx`).
Move this file to `frontend/public/model.onnx` so the frontend application can load it natively in the browser.
