import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { ZoneId } from "../HoloModel3D";
import type { RegionBounds3D } from "../lib/regionBounds";

interface MeshCalloutBoxProps {
  regionId: ZoneId;
  bounds: RegionBounds3D;
  meshObject: THREE.Object3D | null;
  risk: number;
  label: string;
  detail?: string;
  isSelected?: boolean;
  onSelect?: (zone: ZoneId) => void;
  indexOffset?: number;
}

export function MeshCalloutBox({
  regionId,
  bounds,
  meshObject,
  risk,
  label,
  detail,
  isSelected,
  onSelect,
  indexOffset = 0,
}: MeshCalloutBoxProps) {
  const { camera, size } = useThree();
  const [screenRect, setScreenRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    visible: boolean;
    isBackface: boolean;
  }>({ x: 0, y: 0, w: 0, h: 0, visible: false, isBackface: false });

  // Reusable vectors to eliminate GC allocations during useFrame
  const cornerVecsRef = useRef<THREE.Vector3[]>(
    Array.from({ length: 8 }, () => new THREE.Vector3())
  );
  const centerVecRef = useRef(new THREE.Vector3());
  const normalVecRef = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!meshObject || risk <= 0) return;

    const { min, max, center } = bounds;
    const corners = cornerVecsRef.current;

    // 8 Bounding Box Corners in Local Space
    corners[0].set(min[0], min[1], min[2]);
    corners[1].set(min[0], min[1], max[2]);
    corners[2].set(min[0], max[1], min[2]);
    corners[3].set(min[0], max[1], max[2]);
    corners[4].set(max[0], min[1], min[2]);
    corners[5].set(max[0], min[1], max[2]);
    corners[6].set(max[0], max[1], min[2]);
    corners[7].set(max[0], max[1], max[2]);

    meshObject.updateMatrixWorld(true);
    const matrixWorld = meshObject.matrixWorld;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Transform each 3D corner to World Space and Project to Screen Space
    for (let i = 0; i < 8; i++) {
      const v = corners[i].applyMatrix4(matrixWorld);
      v.project(camera);

      const px = ((v.x + 1) / 2) * size.width;
      const py = ((1 - v.y) / 2) * size.height;

      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    // 10% Proportional Padding based on region's own computed size
    const rawW = maxX - minX;
    const rawH = maxY - minY;
    const padX = Math.max(8, rawW * 0.10);
    const padY = Math.max(8, rawH * 0.10);

    const x = minX - padX;
    const y = minY - padY;
    const w = rawW + padX * 2;
    const h = rawH + padY * 2;

    // Check center depth & backface visibility
    const worldCenter = centerVecRef.current.set(...center).applyMatrix4(matrixWorld);
    const camDir = normalVecRef.current.copy(camera.position).sub(worldCenter).normalize();
    const meshForward = new THREE.Vector3(0, 0, 1).applyQuaternion(meshObject.quaternion);
    const dot = meshForward.dot(camDir);

    setScreenRect({
      x,
      y,
      w,
      h,
      visible: w > 10 && h > 10,
      isBackface: dot < -0.2, // Hides callout if facing away from camera
    });
  });

  if (!screenRect.visible || screenRect.isBackface || risk <= 0) return null;

  const isLeftBody = regionId.startsWith("left") || regionId === "chest";
  const lineDirection = isLeftBody ? 1 : -1;

  const cardX = isLeftBody ? screenRect.x + screenRect.w + 40 : screenRect.x - 220;
  const cardY = screenRect.y + (indexOffset * 42);

  const riskColor = risk >= 65 ? "#ef4444" : risk >= 30 ? "#f97316" : "#eab308";
  const badgeBg = risk >= 65 ? "bg-red-500/20 text-red-400 border-red-500/40" : risk >= 30 ? "bg-orange-500/20 text-orange-400 border-orange-500/40" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";

  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* 2D Bounding Box with dashed border derived directly from mesh geometry */}
        <div
          className="absolute border-2 border-dashed rounded-lg transition-all duration-75 pointer-events-auto cursor-pointer"
          style={{
            left: `${screenRect.x}px`,
            top: `${screenRect.y}px`,
            width: `${screenRect.w}px`,
            height: `${screenRect.h}px`,
            borderColor: riskColor,
            boxShadow: `0 0 12px ${riskColor}40`,
            backgroundColor: `${riskColor}10`,
          }}
          onClick={() => onSelect && onSelect(regionId)}
        />

        {/* SVG Leader Line connecting 3D bounding box to Callout Card */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <line
            x1={isLeftBody ? screenRect.x + screenRect.w : screenRect.x}
            y1={screenRect.y + screenRect.h / 2}
            x2={isLeftBody ? cardX : cardX + 210}
            y2={cardY + 24}
            stroke={riskColor}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <circle
            cx={isLeftBody ? screenRect.x + screenRect.w : screenRect.x}
            cy={screenRect.y + screenRect.h / 2}
            r="3"
            fill={riskColor}
          />
        </svg>

        {/* HTML Callout Card */}
        <div
          className="absolute z-20 pointer-events-auto bg-slate-950/90 border border-slate-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md w-52 transition-all duration-100"
          style={{
            left: `${cardX}px`,
            top: `${cardY}px`,
          }}
          onClick={() => onSelect && onSelect(regionId)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-extrabold text-white text-xs">
              {regionId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeBg}`}>
              {risk}%
            </span>
          </div>
          <div className="text-[10px] font-medium text-slate-300 leading-snug">
            {detail || label || `Elevated strain detected in ${regionId.replace("_", " ")}`}
          </div>
        </div>
      </div>
    </Html>
  );
}
