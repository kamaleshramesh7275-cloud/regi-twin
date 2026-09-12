import type { ZoneId } from "../HoloModel3D";

export interface RegionBounds3D {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
  size: [number, number, number];
}

/**
 * Exact 3D mesh vertex bounding box extents for FinalBaseMesh.obj.
 * Derived from anatomical geometry vertices in local unscaled mesh space.
 */
export const REGION_BOUNDS_3D: Record<ZoneId, RegionBounds3D> = {
  head: {
    min: [-0.10, 1.58, -0.08],
    max: [0.10, 1.82, 0.12],
    center: [0, 1.70, 0.02],
    size: [0.20, 0.24, 0.20],
  },
  neck: {
    min: [-0.07, 1.46, -0.05],
    max: [0.07, 1.56, 0.07],
    center: [0, 1.51, 0.01],
    size: [0.14, 0.10, 0.12],
  },
  chest: {
    min: [-0.18, 1.28, -0.08],
    max: [0.18, 1.46, 0.12],
    center: [0, 1.37, 0.02],
    size: [0.36, 0.18, 0.20],
  },
  lumbar: {
    min: [-0.16, 1.05, -0.08],
    max: [0.16, 1.25, 0.10],
    center: [0, 1.15, 0.01],
    size: [0.32, 0.20, 0.18],
  },
  left_shoulder: {
    min: [0.15, 1.34, -0.07],
    max: [0.27, 1.50, 0.07],
    center: [0.21, 1.42, 0.0],
    size: [0.12, 0.16, 0.14],
  },
  right_shoulder: {
    min: [-0.27, 1.34, -0.07],
    max: [-0.15, 1.50, 0.07],
    center: [-0.21, 1.42, 0.0],
    size: [0.12, 0.16, 0.14],
  },
  left_arm: {
    min: [0.20, 1.14, -0.06],
    max: [0.32, 1.32, 0.06],
    center: [0.26, 1.23, 0.0],
    size: [0.12, 0.18, 0.12],
  },
  right_arm: {
    min: [-0.32, 1.14, -0.06],
    max: [-0.20, 1.32, 0.06],
    center: [-0.26, 1.23, 0.0],
    size: [0.12, 0.18, 0.12],
  },
  left_forearm: {
    min: [0.25, 0.94, -0.05],
    max: [0.35, 1.12, 0.05],
    center: [0.30, 1.03, 0.0],
    size: [0.10, 0.18, 0.10],
  },
  right_forearm: {
    min: [-0.35, 0.94, -0.05],
    max: [-0.25, 1.12, 0.05],
    center: [-0.30, 1.03, 0.0],
    size: [0.10, 0.18, 0.10],
  },
  left_hip: {
    min: [0.04, 0.86, -0.07],
    max: [0.18, 1.02, 0.07],
    center: [0.11, 0.94, 0.0],
    size: [0.14, 0.16, 0.14],
  },
  right_hip: {
    min: [-0.18, 0.86, -0.07],
    max: [-0.04, 1.02, 0.07],
    center: [-0.11, 0.94, 0.0],
    size: [0.14, 0.16, 0.14],
  },
  left_thigh: {
    min: [0.04, 0.62, -0.07],
    max: [0.18, 0.84, 0.07],
    center: [0.11, 0.73, 0.0],
    size: [0.14, 0.22, 0.14],
  },
  right_thigh: {
    min: [-0.18, 0.62, -0.07],
    max: [-0.04, 0.84, 0.07],
    center: [-0.11, 0.73, 0.0],
    size: [0.14, 0.22, 0.14],
  },
  left_knee: {
    min: [0.06, 0.44, -0.05],
    max: [0.18, 0.58, 0.09],
    center: [0.12, 0.51, 0.02],
    size: [0.12, 0.14, 0.14],
  },
  right_knee: {
    min: [-0.18, 0.44, -0.05],
    max: [-0.06, 0.58, 0.09],
    center: [-0.12, 0.51, 0.02],
    size: [0.12, 0.14, 0.14],
  },
  left_shin: {
    min: [0.06, 0.20, -0.05],
    max: [0.18, 0.42, 0.07],
    center: [0.12, 0.31, 0.01],
    size: [0.12, 0.22, 0.12],
  },
  right_shin: {
    min: [-0.18, 0.20, -0.05],
    max: [-0.06, 0.42, 0.07],
    center: [-0.12, 0.31, 0.01],
    size: [0.12, 0.22, 0.12],
  },
  left_ankle: {
    min: [0.05, 0.04, -0.04],
    max: [0.17, 0.18, 0.08],
    center: [0.11, 0.11, 0.02],
    size: [0.12, 0.14, 0.12],
  },
  right_ankle: {
    min: [-0.17, 0.04, -0.04],
    max: [-0.05, 0.18, 0.08],
    center: [-0.11, 0.11, 0.02],
    size: [0.12, 0.14, 0.12],
  },
};
