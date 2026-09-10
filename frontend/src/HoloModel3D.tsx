import React, { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import HoloOverlay from "./HoloOverlay";
import { Activity, AlertTriangle, Flame, Layers } from "lucide-react";
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

const HEAT_ZONES: ZoneId[] = [
  "head", "neck", "chest", "lumbar",
  "left_shoulder", "right_shoulder",
  "left_hip", "right_hip",
  "left_knee", "right_knee",
  "left_ankle", "right_ankle"
];

const HEAT_RADII: Record<ZoneId, number> = {
  head: 0.14,  neck: 0.10,  chest: 0.20,  lumbar: 0.18,
  left_shoulder: 0.15,  right_shoulder: 0.15,
  left_arm: 0.12,       right_arm: 0.12,
  left_forearm: 0.10,   right_forearm: 0.10,
  left_hip: 0.17,       right_hip: 0.17,
  left_thigh: 0.16,     right_thigh: 0.16,
  left_knee: 0.14,      right_knee: 0.14,
  left_shin: 0.12,      right_shin: 0.12,
  left_ankle: 0.10,     right_ankle: 0.10,
};

// Risk → color mapping (health status colors)
function getZoneColor(risk: number | null | undefined) {
  if (risk == null) return { hex: "#6b7280", rgb: [0.42, 0.45, 0.50], isData: false };
  if (risk > 60)   return { hex: "#ef4444", rgb: [0.94, 0.27, 0.27], isData: true };
  if (risk > 30)   return { hex: "#f59e0b", rgb: [0.96, 0.62, 0.07], isData: true };
  return               { hex: "#10b981", rgb: [0.06, 0.73, 0.51], isData: true };
}

// Skin preset configurations
type SkinPreset = "ecorche" | "clay" | "realistic" | "anatomy" | "thermal";
const SKIN_PRESETS: Record<SkinPreset, { label: string; baseHex: string; roughness: number; metalness: number; opacity: number; emissiveHex: string; emissiveIntensity: number }> = {
  ecorche: {
    label: "Écorché Anatomy",
    baseHex: "#d89b8a",       // warm terracotta muscle clay matching medical écorché reference
    roughness: 0.72,
    metalness: 0.02,
    opacity: 1.0,
    emissiveHex: "#221310",
    emissiveIntensity: 0.04,
  },
  clay: {
    label: "Anatomical Clay",
    baseHex: "#dbe0e6",       // light grey/off-white matte clay sculpture
    roughness: 0.82,
    metalness: 0.0,
    opacity: 1.0,
    emissiveHex: "#1c2026",
    emissiveIntensity: 0.06,
  },
  realistic: {
    label: "Realistic Human",
    baseHex: "#c68642",       // warm olive/tan male skin
    roughness: 0.62,
    metalness: 0.0,
    opacity: 1.0,
    emissiveHex: "#2a1506",
    emissiveIntensity: 0.08,
  },
  anatomy: {
    label: "Anatomy Scan",
    baseHex: "#0e3b6b",
    roughness: 0.15,
    metalness: 0.2,
    opacity: 0.78,
    emissiveHex: "#062040",
    emissiveIntensity: 0.5,
  },
  thermal: {
    label: "Thermal Imaging",
    baseHex: "#1a1a1a",
    roughness: 0.80,
    metalness: 0.0,
    opacity: 1.0,
    emissiveHex: "#000000",
    emissiveIntensity: 0.0,
  },
};

// ── Clean Medical Anatomy Zone Marker ────────────────────────────────────────
function AnatomyMarker({
  zoneId, position, risk, confidence, isSelected, onZoneClick, label,
}: {
  zoneId: ZoneId;
  position: [number, number, number];
  risk: number | null | undefined;
  confidence: string;
  isSelected: boolean;
  onZoneClick: (zone: ZoneId) => void;
  label: string;
}) {
  const dotRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { hex, isData } = getZoneColor(risk);
  const isHighRisk = (risk || 0) > 60;
  const isElevated = (risk || 0) > 30;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (dotRef.current) {
      const pulse = (isSelected || isHighRisk) ? 1 + Math.sin(t * 4.5) * 0.18 : 1;
      dotRef.current.scale.setScalar(pulse);
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (isSelected || hovered)
        ? 0.55 + Math.sin(t * 3) * 0.15
        : isHighRisk ? 0.35 + Math.sin(t * 3.5) * 0.12
        : 0.20;
    }
  });

  const showLabel = isSelected || hovered || isHighRisk;

  return (
    <group position={position}>
      {/* Clickable solid dot */}
      <mesh
        ref={dotRef}
        onClick={(e) => { e.stopPropagation(); onZoneClick(zoneId); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[0.022, 14, 14]} />
        <meshBasicMaterial color={hovered ? "#ffffff" : hex} />
      </mesh>

      {/* Soft glow halo ring */}
      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.030, 0.052, 24]} />
        <meshBasicMaterial color={hex} side={THREE.DoubleSide} transparent opacity={0.22} />
      </mesh>

      {/* Label badge */}
      {showLabel && (
        <Html
          position={[position[0] > 0 ? 0.06 : -0.06, 0.02, 0]}
          center={false}
          style={{
            transform: position[0] > 0 ? "translate(0%, -50%)" : "translate(-100%, -50%)",
            pointerEvents: "none",
          }}
        >
          <AnimatePresence>
            <motion.div
              key={zoneId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap backdrop-blur-md border shadow-lg ${
                isHighRisk
                  ? "bg-red-950/80 border-red-400/50 text-red-200"
                  : isElevated
                  ? "bg-amber-950/80 border-amber-400/50 text-amber-200"
                  : "bg-black/70 border-white/15 text-white/80"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: hex, boxShadow: `0 0 6px ${hex}` }}
              />
              <span>{label}</span>
              {isData && (
                <span className="font-bold opacity-80">{risk}%</span>
              )}
              {isHighRisk && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
            </motion.div>
          </AnimatePresence>
        </Html>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html position={[0, 0.12, 0]} center zIndexRange={[100, 0]}>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/90 border border-white/15 rounded-xl px-3 py-2 text-xs pointer-events-none w-44 shadow-xl"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">{label}</span>
              <span className="font-mono font-black" style={{ color: hex }}>
                {isData ? `${risk}%` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Confidence</span>
              <span className={
                confidence === "high" ? "text-emerald-400" :
                confidence === "medium" ? "text-amber-400" : "text-gray-500"
              }>{confidence}</span>
            </div>
            {isHighRisk && (
              <div className="mt-1.5 pt-1.5 border-t border-red-500/25 text-[10px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Elevated strain detected
              </div>
            )}
          </motion.div>
        </Html>
      )}
    </group>
  );
}

<<<<<<< HEAD
// ── Realistic Male Human 3D Model ─────────────────────────────────────────────
function RealHumanoid3D({
  riskData, confidenceData, selectedZone, onZoneClick,
  heatMapEnabled = true, preset = "ecorche",
}: HoloModel3DProps & { heatMapEnabled?: boolean; preset?: SkinPreset }) {
  const { scene } = useGLTF("/model.glb");
  const { userHeight } = useAvatar();
=======
// ── Realistic 3D Humanoid Model with Automatic Anatomical Bounding Alignment ──
function RealHumanoid3D({ riskData, confidenceData, selectedZone, onZoneClick, debugScale, debugY }: HoloModel3DProps & { debugScale: number, debugY: number }) {
  const { scene } = useGLTF("/model.glb");
>>>>>>> e296950b6aeab7cfe0a0fa3423e327262b89ace8

  const cfg = SKIN_PRESETS[preset];

<<<<<<< HEAD
  // Shader uniforms for the heat-map additive overlay
  const uniformsRef = useRef({
    uHeatCenters:      { value: Array.from({ length: 12 }, () => new THREE.Vector3()) },
    uHeatRisks:        { value: new Float32Array(12) },
    uHeatRadii:        { value: new Float32Array(12) },
    uSelectedZoneIdx:  { value: -1 },
    uHeatOpacity:      { value: heatMapEnabled ? 1.0 : 0.0 },
    uTime:             { value: 0 },
    uSkinMode:         { value: preset === "thermal" ? 1.0 : 0.0 },
  });

  const { cloned, jointPositions } = useMemo(() => {
    const c = cloneSkeleton(scene);

    // ── Natural A-Pose ────────────────────────────────────────────────────────
    const leftArm     = c.getObjectByName("mixamorigLeftArm");
    const rightArm    = c.getObjectByName("mixamorigRightArm");
    const leftForeArm = c.getObjectByName("mixamorigLeftForeArm");
    const rightForeArm= c.getObjectByName("mixamorigRightForeArm");
    const leftHand    = c.getObjectByName("mixamorigLeftHand");
    const rightHand   = c.getObjectByName("mixamorigRightHand");

    if (leftArm && rightArm) {
      leftArm.rotation.z  = -1.18; rightArm.rotation.z  = 1.18;
      leftArm.rotation.x  =  0.12; rightArm.rotation.x  = 0.12;
      leftArm.rotation.y  =  0.10; rightArm.rotation.y  = -0.10;
    }
    if (leftForeArm && rightForeArm) {
      leftForeArm.rotation.z  =  0.15;
      rightForeArm.rotation.z = -0.15;
    }
    if (leftHand && rightHand) {
      leftHand.rotation.x = rightHand.rotation.x = -0.10;
    }

    // ── Scale to user height ──────────────────────────────────────────────────
    const scale = userHeight ? (userHeight / 100) / 1.78 : 1.0;
    c.scale.set(scale, scale, scale);
    c.position.set(0, 0, 0);
    c.updateMatrixWorld(true);

    // ── Anatomical bone → world-position mapping ──────────────────────────────
    const boneConfigs: Record<ZoneId, { bone: string; offset: [number, number, number] }> = {
      head:           { bone: "mixamorigHead",         offset: [0, 0.08, 0.04] },
      neck:           { bone: "mixamorigNeck",         offset: [0, 0, 0.02] },
      chest:          { bone: "mixamorigSpine2",       offset: [0, 0, 0.08] },
      lumbar:         { bone: "mixamorigSpine",        offset: [0, 0, 0.06] },
      left_shoulder:  { bone: "mixamorigLeftArm",      offset: [0, 0, 0] },
      right_shoulder: { bone: "mixamorigRightArm",     offset: [0, 0, 0] },
      left_arm:       { bone: "mixamorigLeftArm",      offset: [0.08, 0, 0] },
      right_arm:      { bone: "mixamorigRightArm",     offset: [-0.08, 0, 0] },
      left_forearm:   { bone: "mixamorigLeftForeArm",  offset: [0, 0, 0] },
      right_forearm:  { bone: "mixamorigRightForeArm", offset: [0, 0, 0] },
      left_hip:       { bone: "mixamorigLeftUpLeg",    offset: [0.03, 0, 0.02] },
      right_hip:      { bone: "mixamorigRightUpLeg",   offset: [-0.03, 0, 0.02] },
      left_thigh:     { bone: "mixamorigLeftUpLeg",    offset: [0.03, -0.20, 0.02] },
      right_thigh:    { bone: "mixamorigRightUpLeg",   offset: [-0.03, -0.20, 0.02] },
      left_knee:      { bone: "mixamorigLeftLeg",      offset: [0, 0, 0.06] },
      right_knee:     { bone: "mixamorigRightLeg",     offset: [0, 0, 0.06] },
      left_shin:      { bone: "mixamorigLeftLeg",      offset: [0, -0.22, 0.04] },
      right_shin:     { bone: "mixamorigRightLeg",     offset: [0, -0.22, 0.04] },
      left_ankle:     { bone: "mixamorigLeftFoot",     offset: [0, 0, 0.02] },
      right_ankle:    { bone: "mixamorigRightFoot",    offset: [0, 0, 0.02] },
    };

    const positions: Partial<Record<ZoneId, [number, number, number]>> = {};
    for (const [zone, conf] of Object.entries(boneConfigs) as [ZoneId, typeof boneConfigs[ZoneId]][]) {
      const bone = c.getObjectByName(conf.bone);
      if (bone) {
        const wp = new THREE.Vector3();
        bone.getWorldPosition(wp);
        positions[zone] = [
          wp.x + conf.offset[0] * scale,
          wp.y + conf.offset[1] * scale,
          wp.z + conf.offset[2] * scale,
        ];
      }
    }

    // ── Realistic PBR Skin Material ───────────────────────────────────────────
    const skinMat = new THREE.MeshStandardMaterial({
      color:             new THREE.Color(cfg.baseHex),
      emissive:          new THREE.Color(cfg.emissiveHex),
      emissiveIntensity: cfg.emissiveIntensity,
      roughness:         cfg.roughness,
      metalness:         cfg.metalness,
      transparent:       cfg.opacity < 1,
      opacity:           cfg.opacity,
      side:              THREE.FrontSide,
      depthWrite:        cfg.opacity >= 1,
    });

    // GLSL patch — heat-map additive overlay on top of realistic skin
    skinMat.onBeforeCompile = (shader) => {
      shader.uniforms.uHeatCenters     = uniformsRef.current.uHeatCenters;
      shader.uniforms.uHeatRisks       = uniformsRef.current.uHeatRisks;
      shader.uniforms.uHeatRadii       = uniformsRef.current.uHeatRadii;
      shader.uniforms.uSelectedZoneIdx = uniformsRef.current.uSelectedZoneIdx;
      shader.uniforms.uHeatOpacity     = uniformsRef.current.uHeatOpacity;
      shader.uniforms.uTime            = uniformsRef.current.uTime;
      shader.uniforms.uSkinMode        = uniformsRef.current.uSkinMode;

      // Vertex: pass world position for distance calculations
      shader.vertexShader = `varying vec3 vWorldPos;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );
=======
    c.scale.set(debugScale, debugScale, debugScale);
    c.position.set(0, debugY, 0);

    return c;
  }, [scene, debugScale, debugY]);
>>>>>>> e296950b6aeab7cfe0a0fa3423e327262b89ace8

      // Fragment: inject additive heat-map on top of PBR output
      shader.fragmentShader = `
        varying vec3 vWorldPos;
        uniform vec3  uHeatCenters[12];
        uniform float uHeatRisks[12];
        uniform float uHeatRadii[12];
        uniform int   uSelectedZoneIdx;
        uniform float uHeatOpacity;
        uniform float uTime;
        uniform float uSkinMode;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `
        #include <dithering_fragment>

        // Thermal preset: desaturate skin to grayscale
        if (uSkinMode > 0.5) {
          float grey = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
          gl_FragColor.rgb = vec3(grey) * 0.6;
        }

        // Additive heat-map overlay (does NOT replace skin — blends on top)
        if (uHeatOpacity > 0.001) {
          vec3  heatAccum  = vec3(0.0);
          float heatWeight = 0.0;

          for (int i = 0; i < 12; i++) {
            float risk = uHeatRisks[i];
            if (risk < 1.0) continue;

            float r    = uHeatRadii[i];
            float dist = distance(vWorldPos, uHeatCenters[i]);
            if (dist >= r) continue;

            float factor = pow(1.0 - smoothstep(0.0, r, dist), 1.8);

            // Pulse on high-risk zones
            if (risk > 60.0) factor *= 0.80 + 0.20 * sin(uTime * 4.2);

            // Boost selected zone
            if (i == uSelectedZoneIdx) factor *= 1.6;

            // Colour ramp: green → amber → red
            vec3 heatCol = vec3(0.06, 0.73, 0.51);  // green
            if (risk > 60.0) {
              float t2 = clamp((risk - 60.0) / 40.0, 0.0, 1.0);
              heatCol = mix(vec3(0.96, 0.62, 0.07), vec3(0.95, 0.15, 0.15), t2);
            } else if (risk > 30.0) {
              float t2 = clamp((risk - 30.0) / 30.0, 0.0, 1.0);
              heatCol = mix(vec3(0.06, 0.73, 0.51), vec3(0.96, 0.62, 0.07), t2);
            }

            heatAccum  += heatCol * factor;
            heatWeight  = max(heatWeight, factor);
          }

          if (heatWeight > 0.001) {
            // Additive mode: glow sits on top of skin without erasing it
            float blendAlpha = clamp(heatWeight * uHeatOpacity * 0.65, 0.0, 0.70);
            gl_FragColor.rgb += heatAccum * blendAlpha * 1.4;
            // Clamp so we don't blow out whites
            gl_FragColor.rgb = clamp(gl_FragColor.rgb, 0.0, 1.0);
          }
        }
        `
      );
    };

    c.traverse((node: any) => {
      if (!node.isMesh) return;
      node.castShadow    = true;
      node.receiveShadow = true;
      node.frustumCulled = false;
      // Apply skinMat to all meshes (including Beta_Joints) to keep the body connected
      node.material = skinMat;
    });

    return { cloned: c, jointPositions: positions };
  }, [scene, userHeight, preset]);

  // Sync uniforms every frame
  useFrame((state) => {
    const u = uniformsRef.current;
    u.uTime.value       = state.clock.getElapsedTime();
    u.uHeatOpacity.value= heatMapEnabled ? 1.0 : 0.0;
    u.uSkinMode.value   = preset === "thermal" ? 1.0 : 0.0;

    let selIdx = -1;
    HEAT_ZONES.forEach((zone, idx) => {
      const pos = jointPositions[zone];
      if (pos) u.uHeatCenters.value[idx].set(...pos);
      u.uHeatRisks.value[idx] = riskData[zone] ?? 0;
      u.uHeatRadii.value[idx] = HEAT_RADII[zone] ?? 0.14;
      if (selectedZone === zone) selIdx = idx;
    });
    u.uSelectedZoneIdx.value = selIdx;
  });

  const getConf = (z: ZoneId) => confidenceData?.[z] || "none";

  return (
    <group>
      <primitive object={cloned} />

      {/* Anatomical zone markers — only shown zones with data or selection */}
      {(Object.keys(HEAT_RADII) as ZoneId[]).map((zone) => {
        const pos = jointPositions[zone];
        if (!pos) return null;
        const risk = riskData[zone];
        const isHighRisk = (risk || 0) > 60;
        // Only render if there's data, or it's selected, or high risk
        if (risk == null && selectedZone !== zone) return null;
        return (
          <AnatomyMarker
            key={zone}
            zoneId={zone}
            position={pos}
            risk={risk}
            confidence={getConf(zone)}
            isSelected={selectedZone === zone}
            onZoneClick={onZoneClick}
            label={zone.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          />
        );
      })}
    </group>
  );
}

// ── Main HoloModel3D Viewport ─────────────────────────────────────────────────
export default function HoloModel3D(props: HoloModel3DProps) {
  const [heatMapEnabled, setHeatMapEnabled] = useState(true);
  const [preset, setPreset] = useState<SkinPreset>("ecorche");
  const activeMode = props.viewMode ?? "3d";

  const cyclePreset = () =>
    setPreset(p => p === "ecorche" ? "clay" : p === "clay" ? "realistic" : p === "realistic" ? "anatomy" : p === "anatomy" ? "thermal" : "ecorche");

  const [debugScale, setDebugScale] = useState<number>(1.0);
  const [debugY, setDebugY] = useState<number>(0);

  return (
<<<<<<< HEAD
    <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: "#3e424a" }}>
      {/* Soft neutral studio vignette matching reference image */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(20,23,28,0.60) 100%)" }}
      />
=======
    <div className="absolute inset-0 z-0 bg-[#020a14] overflow-hidden">
      {/* Debug Controls */}
      {activeMode === "3d" && (
        <div className="absolute top-20 left-4 z-50 bg-black/80 border border-white/20 p-4 rounded-xl text-white text-xs w-64">
          <div className="mb-2 font-bold text-cyan-400">Alignment Debugger</div>
          <div className="mb-4">
            <label className="block mb-1">Scale: {debugScale.toFixed(2)}</label>
            <input type="range" min="0.1" max="4" step="0.01" value={debugScale} onChange={e => setDebugScale(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block mb-1">Y-Offset: {debugY.toFixed(2)}</label>
            <input type="range" min="-3" max="3" step="0.01" value={debugY} onChange={e => setDebugY(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div className="mt-3 text-[10px] text-gray-400">
            Slide until the blue mesh fits the green spots, then tell me the numbers!
          </div>
        </div>
      )}
>>>>>>> e296950b6aeab7cfe0a0fa3423e327262b89ace8

      {activeMode === "scan" ? (
        <HoloOverlay {...props} />
      ) : (
        <>
          <Canvas
            shadows
            camera={{ position: [0, 0.95, 2.8], fov: 40 }}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
          >
            {/* Neutral grey studio backdrop matching écorché reference */}
            <color attach="background" args={["#484d56"]} />

<<<<<<< HEAD
            {/* ── Studio 3-point lighting for muscular écorché anatomy ── */}
            {/* Ambient: soft neutral fill */}
            <ambientLight intensity={0.65} color="#edf1f7" />
=======
          <Suspense fallback={null}>
            <RealHumanoid3D {...props} debugScale={debugScale} debugY={debugY} />
          </Suspense>
>>>>>>> e296950b6aeab7cfe0a0fa3423e327262b89ace8

            {/* Key light: crisp soft white, front-right to define muscle boundaries */}
            <directionalLight
              position={[2.2, 4.0, 3.2]}
              intensity={3.8}
              color="#ffffff"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-near={0.5}
              shadow-camera-far={8}
              shadow-camera-left={-2}
              shadow-camera-right={2}
              shadow-camera-top={2.5}
              shadow-camera-bottom={-0.5}
            />

            {/* Fill light: soft cool fill, front-left */}
            <directionalLight
              position={[-2.4, 2.0, 2.2]}
              intensity={2.0}
              color="#dce6f2"
            />

            {/* Rim / back light: crisp contour definition along shoulders and arms */}
            <directionalLight
              position={[0.2, 2.8, -3.0]}
              intensity={2.8}
              color="#f4e8e1"
            />

            {/* Under fill to illuminate abs and legs evenly */}
            <pointLight position={[0, 0.6, 1.8]} intensity={1.0} color="#f5e6de" />

            {/* ── Shadow floor plane ─────────────────────────────────────── */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[6, 6]} />
              <shadowMaterial opacity={0.35} />
            </mesh>

            <Suspense fallback={null}>
              <RealHumanoid3D
                {...props}
                heatMapEnabled={heatMapEnabled}
                preset={preset}
              />
            </Suspense>

            <OrbitControls
              target={[0, 0.88, 0]}
              enablePan={false}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.6}
              minDistance={1.5}
              maxDistance={4.2}
              dampingFactor={0.06}
              enableDamping
            />

            <EffectComposer>
              {/* Subtle bloom only on high-emission zones */}
              <Bloom luminanceThreshold={0.80} luminanceSmoothing={0.9} intensity={0.25} height={256} />
              <Vignette eskil={false} offset={0.35} darkness={0.50} />
            </EffectComposer>
          </Canvas>

          {/* Floating controls */}
          <div className="absolute top-20 left-6 z-20 flex flex-col gap-2 pointer-events-auto">
            {/* Heat Map Toggle */}
            <button
              onClick={() => setHeatMapEnabled(p => !p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-xl border shadow-lg transition-all cursor-pointer ${
                heatMapEnabled
                  ? "bg-orange-500/20 border-orange-400/50 text-orange-300 shadow-orange-500/15"
                  : "bg-black/60 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${heatMapEnabled ? "text-orange-400 animate-pulse" : "text-gray-500"}`} />
              Strain Heat Map {heatMapEnabled ? "ON" : "OFF"}
            </button>

            {/* Preset Switcher */}
            <button
              onClick={cyclePreset}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-black/60 border border-white/10 text-gray-300 hover:text-white backdrop-blur-xl shadow-lg transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              {SKIN_PRESETS[preset].label}
            </button>
          </div>

          {/* Status bar */}
          <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl text-[11px] text-white/60 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Digital Twin · Real-time kinematic strain analysis active</span>
          </div>
        </>
      )}
    </div>
  );
}
