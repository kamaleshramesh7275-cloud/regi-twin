import React, { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import HoloOverlay from "./HoloOverlay";
import { Eye, Box, Sparkles, Activity, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAvatar } from "./AvatarContext";

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
export type ZoneConfidence = Partial<Record<ZoneId, string>>;

export interface HoloModel3DProps {
  riskData: ZoneRisk;
  confidenceData?: ZoneConfidence;
  selectedZone: ZoneId | null;
  onZoneClick: (zone: ZoneId) => void;
  viewMode?: "scan" | "3d";
  onViewModeChange?: (mode: "scan" | "3d") => void;
}

function getZoneColor(risk: number | null | undefined): { color: string; emissive: string; intensity: number; isData: boolean } {
  if (risk === null || risk === undefined) return { color: "#6b7280", emissive: "#4b5563", intensity: 0.2, isData: false }; // Neutral Grey for no data
  if (risk > 60) return { color: "#ef4444", emissive: "#ef4444", intensity: 2.4, isData: true }; // High Risk (Red)
  if (risk > 30) return { color: "#f59e0b", emissive: "#f59e0b", intensity: 1.6, isData: true }; // Moderate (Amber)
  return { color: "#10b981", emissive: "#10b981", intensity: 0.8, isData: true }; // Low Risk (Green)
}

// ── 3D Human Joint Beacon ───────────────────────────────────────────────────
function JointBeacon({
  zoneId,
  position,
  risk,
  confidence,
  isSelected,
  onZoneClick,
  label,
}: {
  zoneId: ZoneId;
  position: [number, number, number];
  risk: number | null | undefined;
  confidence: string;
  isSelected: boolean;
  onZoneClick: (zone: ZoneId) => void;
  label: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { color, emissive, intensity, isData } = getZoneColor(risk);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      // Only pulse if high risk (>60) or selected
      const isHighRisk = risk !== null && risk !== undefined && risk > 60;
      const scale = isSelected || isHighRisk ? 1 + Math.sin(t * 4) * 0.25 : 1;
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
          transparent={!isData}
          opacity={!isData ? 0.4 : 1.0}
        />
      </mesh>

      {/* Outer Glow Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.13, 32]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={isSelected || hovered ? (isData ? 0.95 : 0.6) : (isData ? 0.45 : 0.1)}
        />
      </mesh>

      {/* Info Card Tooltip */}
      {hovered && (
        <Html position={[0, 0.15, 0]} center zIndexRange={[100, 0]}>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-black/80 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-2xl pointer-events-none w-48"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  {label}
                </h4>
                {isData ? (
                  <span className="text-xs font-mono font-bold" style={{ color }}>{risk}</span>
                ) : (
                  <span className="text-xs text-gray-400">N/A</span>
                )}
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                  <span>Confidence</span>
                  <span className={confidence === 'none' ? 'text-gray-500' : confidence === 'high' ? 'text-emerald-400' : 'text-amber-400'}>
                    {confidence}
                  </span>
                </div>
                {!isData && (
                  <div className="text-[10px] text-gray-500 italic mt-1 border-t border-white/10 pt-1">
                    No recent data for this zone.
                  </div>
                )}
                {isData && (risk || 0) > 60 && (
                   <div className="text-[10px] text-red-400 flex items-center gap-1 border-t border-red-500/30 pt-1 mt-1">
                     <AlertTriangle className="w-3 h-3" />
                     Elevated strain detected
                   </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </Html>
      )}
    </group>
  );
}

// ── Realistic 3D Humanoid Model with Automatic Anatomical Bounding Alignment ──
function RealHumanoid3D({ riskData, confidenceData, selectedZone, onZoneClick }: HoloModel3DProps) {
  const { scene } = useGLTF("/model.glb");
  const { userHeight } = useAvatar(); // e.g. height in cm

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

    // Base standard height on 175cm. If userHeight is available, scale proportionally.
    const targetHeight = userHeight ? (2.4 * (userHeight / 175)) : 2.4;

    // The dynamic Box3 calculation shrinks models if they have large hidden armatures.
    // Use a fixed scale assuming standard ~1.75m model to fit 2.4m height space.
    const scaleMultiplier = targetHeight / 1.75;
    c.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
    
    // Reset position to center, assuming model origin is at feet.
    c.position.set(0, 0, 0);

    return c;
  }, [scene, userHeight]);

  const getConf = (zone: ZoneId) => (confidenceData && confidenceData[zone]) || "none";

  return (
    <group position={[0, -1.2, 0]}>
      <primitive object={cloned} />

      {/* Anatomical Joint Callouts precisely aligned with humanoid body */}
      <JointBeacon zoneId="head" position={[0, 2.25, 0]} risk={riskData.head} confidence={getConf("head")} isSelected={selectedZone === "head"} onZoneClick={onZoneClick} label="Head" />
      <JointBeacon zoneId="neck" position={[0, 2.05, 0]} risk={riskData.neck} confidence={getConf("neck")} isSelected={selectedZone === "neck"} onZoneClick={onZoneClick} label="Cervical" />
      <JointBeacon zoneId="left_shoulder" position={[0.32, 1.95, 0]} risk={riskData.left_shoulder} confidence={getConf("left_shoulder")} isSelected={selectedZone === "left_shoulder"} onZoneClick={onZoneClick} label="L. Shoulder" />
      <JointBeacon zoneId="right_shoulder" position={[-0.32, 1.95, 0]} risk={riskData.right_shoulder} confidence={getConf("right_shoulder")} isSelected={selectedZone === "right_shoulder"} onZoneClick={onZoneClick} label="R. Shoulder" />
      <JointBeacon zoneId="chest" position={[0, 1.8, 0.08]} risk={riskData.chest} confidence={getConf("chest")} isSelected={selectedZone === "chest"} onZoneClick={onZoneClick} label="Chest" />
      <JointBeacon zoneId="lumbar" position={[0, 1.4, 0.05]} risk={riskData.lumbar} confidence={getConf("lumbar")} isSelected={selectedZone === "lumbar"} onZoneClick={onZoneClick} label="Lumbar" />
      <JointBeacon zoneId="left_hip" position={[0.18, 1.2, 0]} risk={riskData.left_hip} confidence={getConf("left_hip")} isSelected={selectedZone === "left_hip"} onZoneClick={onZoneClick} label="L. Hip" />
      <JointBeacon zoneId="right_hip" position={[-0.18, 1.2, 0]} risk={riskData.right_hip} confidence={getConf("right_hip")} isSelected={selectedZone === "right_hip"} onZoneClick={onZoneClick} label="R. Hip" />
      <JointBeacon zoneId="left_knee" position={[0.18, 0.65, 0]} risk={riskData.left_knee} confidence={getConf("left_knee")} isSelected={selectedZone === "left_knee"} onZoneClick={onZoneClick} label="L. Knee" />
      <JointBeacon zoneId="right_knee" position={[-0.18, 0.65, 0]} risk={riskData.right_knee} confidence={getConf("right_knee")} isSelected={selectedZone === "right_knee"} onZoneClick={onZoneClick} label="R. Knee" />
      <JointBeacon zoneId="left_ankle" position={[0.16, 0.1, 0.05]} risk={riskData.left_ankle} confidence={getConf("left_ankle")} isSelected={selectedZone === "left_ankle"} onZoneClick={onZoneClick} label="L. Ankle" />
      <JointBeacon zoneId="right_ankle" position={[-0.16, 0.1, 0.05]} risk={riskData.right_ankle} confidence={getConf("right_ankle")} isSelected={selectedZone === "right_ankle"} onZoneClick={onZoneClick} label="R. Ankle" />

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
