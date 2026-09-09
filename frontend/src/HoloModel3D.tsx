import React, { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import HoloOverlay from "./HoloOverlay";
import { Eye, Box, Sparkles } from "lucide-react";

export type ZoneId =
  | "head" | "neck" | "chest" | "lumbar"
  | "left_shoulder" | "right_shoulder"
  | "left_arm"      | "right_arm"
  | "left_forearm"  | "right_forearm"
  | "left_hip"      | "right_hip"
  | "left_thigh"    | "right_thigh"
  | "left_knee"     | "right_knee"
  | "left_shin"     | "right_shin"
  | "left_ankle"    | "right_ankle";

export type ZoneRisk = Partial<Record<ZoneId, number>>;

export interface HoloModel3DProps {
  riskData: ZoneRisk;
  selectedZone: ZoneId | null;
  onZoneClick: (zone: ZoneId) => void;
  viewMode?: "scan" | "3d";
  onViewModeChange?: (mode: "scan" | "3d") => void;
}

function getZoneColor(risk: number = 0): { color: string; emissive: string; intensity: number } {
  if (risk >= 70) return { color: "#ef4444", emissive: "#ef4444", intensity: 2.4 };
  if (risk >= 35) return { color: "#f59e0b", emissive: "#f59e0b", intensity: 1.6 };
  return { color: "#00f0ff", emissive: "#00f0ff", intensity: 0.8 };
}

// ── 3D Human Joint Beacon ───────────────────────────────────────────────────
function JointBeacon({
  zoneId,
  position,
  risk,
  isSelected,
  onZoneClick,
  label,
}: {
  zoneId: ZoneId;
  position: [number, number, number];
  risk: number;
  isSelected: boolean;
  onZoneClick: (zone: ZoneId) => void;
  label: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { color, emissive, intensity } = getZoneColor(risk);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      const scale = isSelected || risk >= 70 ? 1 + Math.sin(t * 4) * 0.25 : 1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onZoneClick(zoneId);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.075, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={hovered ? "#ffffff" : emissive}
          emissiveIntensity={hovered ? 3.2 : intensity}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Outer Glow Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.13, 32]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={isSelected || hovered ? 0.95 : 0.45}
        />
      </mesh>
    </group>
  );
}

// ── Realistic 3D Humanoid Model with Automatic Anatomical Bounding Alignment ──
function RealHumanoid3D({ riskData, selectedZone, onZoneClick }: HoloModel3DProps) {
  const { scene } = useGLTF("/model.glb");
  const cloned = useMemo(() => {
    const c = scene.clone();
    c.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // Vibrant cyber-biomechanical anatomical material
        node.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#38bdf8"),
          emissive: new THREE.Color("#0284c7"),
          emissiveIntensity: 0.4,
          roughness: 0.15,
          metalness: 0.75,
          transparent: true,
          opacity: 0.92,
          wireframe: false,
        });
      }
    });

    // Compute bounding box to ground the model at y=0 and normalize height to 2.4
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = 2.4 / (size.y || 1);
    c.scale.set(scale, scale, scale);

    const scaledBox = new THREE.Box3().setFromObject(c);
    c.position.y = -scaledBox.min.y; // Aligns feet exactly to y=0
    c.position.x = -(scaledBox.min.x + scaledBox.max.x) / 2; // Centers horizontally
    c.position.z = -(scaledBox.min.z + scaledBox.max.z) / 2; // Centers depth

    return c;
  }, [scene]);

  return (
    <group position={[0, -1.2, 0]}>
      <primitive object={cloned} />

      {/* Anatomical Joint Callouts precisely aligned with humanoid body */}
      <JointBeacon zoneId="head" position={[0, 2.25, 0]} risk={riskData.head ?? 0} isSelected={selectedZone === "head"} onZoneClick={onZoneClick} label="Head" />
      <JointBeacon zoneId="neck" position={[0, 2.05, 0]} risk={riskData.neck ?? (riskData as any).cervical ?? 0} isSelected={selectedZone === "neck"} onZoneClick={onZoneClick} label="Cervical" />
      <JointBeacon zoneId="left_shoulder" position={[0.32, 1.95, 0]} risk={riskData.left_shoulder ?? 0} isSelected={selectedZone === "left_shoulder"} onZoneClick={onZoneClick} label="L. Shoulder" />
      <JointBeacon zoneId="right_shoulder" position={[-0.32, 1.95, 0]} risk={riskData.right_shoulder ?? 0} isSelected={selectedZone === "right_shoulder"} onZoneClick={onZoneClick} label="R. Shoulder" />
      <JointBeacon zoneId="chest" position={[0, 1.8, 0.08]} risk={riskData.chest ?? 0} isSelected={selectedZone === "chest"} onZoneClick={onZoneClick} label="Chest" />
      <JointBeacon zoneId="lumbar" position={[0, 1.4, 0.05]} risk={riskData.lumbar ?? 0} isSelected={selectedZone === "lumbar"} onZoneClick={onZoneClick} label="Lumbar" />
      <JointBeacon zoneId="left_hip" position={[0.18, 1.2, 0]} risk={riskData.left_hip ?? 0} isSelected={selectedZone === "left_hip"} onZoneClick={onZoneClick} label="L. Hip" />
      <JointBeacon zoneId="right_hip" position={[-0.18, 1.2, 0]} risk={riskData.right_hip ?? 0} isSelected={selectedZone === "right_hip"} onZoneClick={onZoneClick} label="R. Hip" />
      <JointBeacon zoneId="left_knee" position={[0.18, 0.65, 0]} risk={riskData.left_knee ?? 0} isSelected={selectedZone === "left_knee"} onZoneClick={onZoneClick} label="L. Knee" />
      <JointBeacon zoneId="right_knee" position={[-0.18, 0.65, 0]} risk={riskData.right_knee ?? 0} isSelected={selectedZone === "right_knee"} onZoneClick={onZoneClick} label="R. Knee" />
      <JointBeacon zoneId="left_ankle" position={[0.16, 0.1, 0.05]} risk={riskData.left_ankle ?? 0} isSelected={selectedZone === "left_ankle"} onZoneClick={onZoneClick} label="L. Ankle" />
      <JointBeacon zoneId="right_ankle" position={[-0.16, 0.1, 0.05]} risk={riskData.right_ankle ?? 0} isSelected={selectedZone === "right_ankle"} onZoneClick={onZoneClick} label="R. Ankle" />

      {/* Cyber Hologram Rings */}
      <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.75, 1.15, 36]} />
          <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} transparent opacity={0.3} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.25, 1.3, 48]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.45} />
        </mesh>
      </group>
    </group>
  );
}

// ── Main HoloModel3D Viewport ────────────────────────────────────────────────
export default function HoloModel3D(props: HoloModel3DProps) {
  const [internalMode, setInternalMode] = useState<"scan" | "3d">("scan");
  const activeMode = props.viewMode ?? internalMode;

  return (
    <div className="absolute inset-0 z-0 bg-[#020a14] overflow-hidden">
      {activeMode === "scan" ? (
        /* Authentic High-Definition Human Skeletal Anatomy Hologram */
        <HoloOverlay {...props} />
      ) : (
        /* Real 3D Humanoid Mesh with OrbitControls */
        <Canvas camera={{ position: [0, 0.1, 4.0], fov: 42 }}>
          <color attach="background" args={["#020a14"]} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[0, 5, 5]} intensity={2.5} color="#ffffff" />
          <directionalLight position={[4, 2, 3]} intensity={1.8} color="#38bdf8" />
          <directionalLight position={[-4, 2, 3]} intensity={1.8} color="#818cf8" />
          <directionalLight position={[0, -2, -4]} intensity={1.0} color="#0284c7" />
          <pointLight position={[0, 1.5, 2.5]} intensity={2.0} color="#00f0ff" />
          <pointLight position={[0, -2, -2]} intensity={0.8} color="#8b5cf6" />

          <Suspense fallback={null}>
            <RealHumanoid3D {...props} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.6}
            minDistance={2.5}
            maxDistance={6.0}
            dampingFactor={0.05}
            enableDamping={true}
          />

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.25}
              luminanceSmoothing={0.9}
              height={300}
              intensity={0.4}
            />
          </EffectComposer>
        </Canvas>
      )}

      {/* Footer Info */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-10 bg-black/40 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl text-[11px] text-cyan-400/80 font-mono flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Live Kinematic Mapping: Real-time joint risk & biometrics</span>
      </div>
    </div>
  );
}
