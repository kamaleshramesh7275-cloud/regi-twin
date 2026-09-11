import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import HoloOverlay from "./HoloOverlay";
import { AlertTriangle, Flame, Layers, Sparkles, FlaskConical, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAvatar } from "./AvatarContext";
import { Link } from "wouter";
import type { GroupedRegionalInsight } from "./context/ClinicInsightsContext";

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
  /** Confirmed clinic insights grouped by anatomical zone */
  regionalInsights?: GroupedRegionalInsight[];
}

const HEAT_ZONES: ZoneId[] = [
  "head", "neck", "chest", "lumbar",
  "left_shoulder", "right_shoulder",
  "left_arm", "right_arm",
  "left_forearm", "right_forearm",
  "left_hip", "right_hip",
  "left_thigh", "right_thigh",
  "left_knee", "right_knee",
  "left_shin", "right_shin",
  "left_ankle", "right_ankle"
];

const HEAT_RADII: Record<ZoneId, number> = {
  head: 0.12,  neck: 0.08,  chest: 0.18,  lumbar: 0.16,
  left_shoulder: 0.12,  right_shoulder: 0.12,
  left_arm: 0.10,       right_arm: 0.10,
  left_forearm: 0.09,   right_forearm: 0.09,
  left_hip: 0.14,       right_hip: 0.14,
  left_thigh: 0.14,     right_thigh: 0.14,
  left_knee: 0.12,      right_knee: 0.12,
  left_shin: 0.11,      right_shin: 0.11,
  left_ankle: 0.08,     right_ankle: 0.08,
};

// Skin preset configurations
type SkinPreset = "ecorche" | "clay" | "realistic" | "anatomy" | "thermal";
const SKIN_PRESETS: Record<SkinPreset, { label: string; baseHex: string; roughness: number; metalness: number; opacity: number; emissiveHex: string; emissiveIntensity: number }> = {
  ecorche: { label: "Écorché Anatomy", baseHex: "#d89b8a", roughness: 0.72, metalness: 0.02, opacity: 1.0, emissiveHex: "#221310", emissiveIntensity: 0.04 },
  clay: { label: "Anatomical Clay", baseHex: "#dbe0e6", roughness: 0.82, metalness: 0.0, opacity: 1.0, emissiveHex: "#1c2026", emissiveIntensity: 0.06 },
  realistic: { label: "Realistic Human", baseHex: "#c68642", roughness: 0.62, metalness: 0.0, opacity: 1.0, emissiveHex: "#2a1506", emissiveIntensity: 0.08 },
  anatomy: { label: "Anatomy Scan", baseHex: "#0e3b6b", roughness: 0.15, metalness: 0.2, opacity: 0.78, emissiveHex: "#062040", emissiveIntensity: 0.5 },
  thermal: { label: "Thermal Imaging", baseHex: "#1a1a1a", roughness: 0.80, metalness: 0.0, opacity: 1.0, emissiveHex: "#000000", emissiveIntensity: 0.0 },
};

function InfoCard({ zoneId, risk, confidence, position }: { zoneId: ZoneId, risk: number, confidence: string, position: [number, number, number] }) {
  const isHighRisk = risk > 60;
  const label = zoneId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Html position={position} center zIndexRange={[100, 0]}>
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-black/90 border border-white/15 rounded-xl px-3 py-2 text-xs pointer-events-none w-48 shadow-xl">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-white">{label}</span>
          <span className="font-mono font-black text-white">{risk}%</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Confidence</span>
          <span className={confidence === "high" ? "text-emerald-400" : confidence === "medium" ? "text-amber-400" : "text-gray-500"}>{confidence}</span>
        </div>
        {isHighRisk && (
          <div className="mt-1.5 pt-1.5 border-t border-red-500/25 text-[10px] text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" /> Elevated strain detected
          </div>
        )}
      </motion.div>
    </Html>
  );
}

// ── Clinic Insight Marker — reuses identical InfoCard visual language ──────────
function trendStatusColor(dir: string | undefined, status: string | undefined) {
  if (status === "high" || status === "low" || status === "flagged") return "text-red-400";
  if (dir === "up" || dir === "down") return "text-amber-400";
  return "text-emerald-400";
}
function trendStatusLabel(dir: string | undefined, status: string | undefined) {
  if (status === "high" || status === "low" || status === "flagged") return "Flagged";
  if (dir === "up")   return "Rising";
  if (dir === "down") return "Falling";
  return "Stable";
}

function ClinicInsightMarker({
  group,
  position,
}: {
  group: GroupedRegionalInsight;
  position: [number, number, number];
}) {
  const [open, setOpen] = useState(false);
  const { metrics, hasFlagged } = group;
  const isGroup = metrics.length > 1;

  // Offset slightly so it does not overlap the biomechanical InfoCard
  const markerPos: [number, number, number] = [position[0] + 0.18, position[1], position[2]];

  return (
    <Html position={markerPos} center zIndexRange={[90, 0]}>
      <div className="relative">
        {/* Glow dot / trigger */}
        <button
          onClick={() => setOpen(p => !p)}
          className={`relative flex items-center justify-center w-5 h-5 rounded-full border shadow-lg cursor-pointer focus:outline-none transition-transform hover:scale-110 ${
            hasFlagged
              ? "bg-red-500/30 border-red-400/60 shadow-red-500/40"
              : "bg-cyan-500/25 border-cyan-400/50 shadow-cyan-500/30"
          }`}
          aria-label={`Clinic insight for ${group.zone}`}
        >
          {/* Pulse ring */}
          <span
            className={`absolute inset-0 rounded-full animate-ping opacity-50 ${
              hasFlagged ? "bg-red-400" : "bg-cyan-400"
            }`}
            style={{ animationDuration: hasFlagged ? "1.2s" : "2.4s" }}
          />
          {hasFlagged ? (
            <AlertTriangle className="w-2.5 h-2.5 text-red-400 relative z-10" />
          ) : (
            <FlaskConical className="w-2.5 h-2.5 text-cyan-300 relative z-10" />
          )}
          {/* Count badge */}
          {isGroup && (
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-white text-black text-[8px] font-black flex items-center justify-center z-20">
              {metrics.length}
            </span>
          )}
        </button>

        {/* Tooltip card — matches InfoCard style exactly */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="clinic-tip"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute left-7 top-0 bg-black/90 border border-white/15 rounded-xl px-3 py-2 text-xs w-52 shadow-xl z-50"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-white/10">
                <span className="font-black text-white text-[11px] flex items-center gap-1">
                  <FlaskConical className="w-3 h-3 text-cyan-400" />
                  Lab Insights
                </span>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-[10px] cursor-pointer">
                  ✕
                </button>
              </div>

              {/* Metric rows */}
              <div className="space-y-1.5">
                {metrics.map(m => {
                  const dir    = m.prediction?.trend_direction;
                  const status = m.latest_status;
                  const isFl   = status === "high" || status === "low" || status === "flagged";
                  return (
                    <div key={m.metric_key} className="space-y-0.5">
                      {/* Title row — font-bold text-white like existing InfoCard */}
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{m.canonical_name}</span>
                        <span className="font-mono font-black text-white">
                          {m.latest_value ?? "—"}
                          <span className="text-gray-400 font-normal ml-0.5 text-[9px]">{m.unit}</span>
                        </span>
                      </div>
                      {/* Trend row — styled like the 'Confidence: high' row */}
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Trend</span>
                        <span className={trendStatusColor(dir, status)}>
                          {trendStatusLabel(dir, status)}
                        </span>
                      </div>
                      {isFl && (
                        <div className="flex items-center gap-1 text-[10px] text-red-400">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> Outside reference range
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Report link tag */}
              <div className="mt-2 pt-1.5 border-t border-white/10">
                <Link
                  href="/clinic"
                  className="flex items-center gap-1 text-[10px] text-cyan-400/80 hover:text-cyan-300 transition-colors font-semibold"
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink className="w-3 h-3" /> From clinic report
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Html>
  );
}

// ── Realistic Human 3D Model ─────────────────────────────────────────────
function RealHumanoid3D({
  riskData, confidenceData, selectedZone, onZoneClick,
  heatMapEnabled = true, preset = "ecorche",
  regionalInsights = [],
}: HoloModel3DProps & { heatMapEnabled?: boolean; preset?: SkinPreset }) {
  const { userHeight } = useAvatar();
  
  // Use the static OBJ mesh
  const obj = useLoader(OBJLoader, "/models/FinalBaseMesh.obj");
  const cfg = SKIN_PRESETS[preset];

  // Shader uniforms for the heat-map additive overlay
  const uniformsRef = useRef({
    uHeatCenters:      { value: Array.from({ length: 20 }, () => new THREE.Vector3()) },
    uHeatRisks:        { value: new Float32Array(20) },
    uHeatRadii:        { value: new Float32Array(20) },
    uSelectedZoneIdx:  { value: -1 },
    uHeatOpacity:      { value: heatMapEnabled ? 1.0 : 0.0 },
    uTime:             { value: 0 },
    uSkinMode:         { value: preset === "thermal" ? 1.0 : 0.0 },
  });

  const { cloned, jointPositions } = useMemo(() => {
    const c = obj.clone(true); // Clone the object group

    // ── Scale to user height ──────────────────────────────────────────────────
    const baseScale = userHeight ? (userHeight / 100) / 1.78 : 1.0;
    const meshCorrectionScale = 0.0858; 
    const finalScale = baseScale * meshCorrectionScale;
    
    c.scale.set(finalScale, finalScale, finalScale);
    c.position.set(0, 0, 0);
    c.updateMatrixWorld(true);

    // ── Hardcoded anatomical positions for the static OBJ mesh ─────────────────
    const basePositions: Record<ZoneId, [number, number, number]> = {
      head:           [0, 1.68, 0.04],
      neck:           [0, 1.52, 0.02],
      chest:          [0, 1.38, 0.08],
      lumbar:         [0, 1.15, 0.06],
      left_shoulder:  [0.16, 1.45, 0],
      right_shoulder: [-0.16, 1.45, 0],
      left_arm:       [0.22, 1.25, 0],
      right_arm:      [-0.22, 1.25, 0],
      left_forearm:   [0.28, 1.05, 0],
      right_forearm:  [-0.28, 1.05, 0],
      left_hip:       [0.10, 0.95, 0.02],
      right_hip:      [-0.10, 0.95, 0.02],
      left_thigh:     [0.11, 0.75, 0.02],
      right_thigh:    [-0.11, 0.75, 0.02],
      left_knee:      [0.12, 0.52, 0.05],
      right_knee:     [-0.12, 0.52, 0.05],
      left_shin:      [0.12, 0.30, 0.04],
      right_shin:     [-0.12, 0.30, 0.04],
      left_ankle:     [0.12, 0.10, 0.02],
      right_ankle:    [-0.12, 0.10, 0.02],
    };

    const positions: Partial<Record<ZoneId, [number, number, number]>> = {};
    for (const [zone, pos] of Object.entries(basePositions) as [ZoneId, typeof basePositions[ZoneId]][]) {
      positions[zone] = [
        pos[0] * baseScale,
        pos[1] * baseScale,
        pos[2] * baseScale,
      ];
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

      // Fragment: inject additive heat-map on top of PBR output
      shader.fragmentShader = `
        varying vec3 vWorldPos;
        uniform vec3  uHeatCenters[20];
        uniform float uHeatRisks[20];
        uniform float uHeatRadii[20];
        uniform int   uSelectedZoneIdx;
        uniform float uHeatOpacity;
        uniform float uTime;
        uniform float uSkinMode;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `
        #include <dithering_fragment>

        if (uSkinMode > 0.5) {
          float grey = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
          gl_FragColor.rgb = vec3(grey) * 0.6;
        }

        if (uHeatOpacity > 0.001) {
          vec3  heatAccum  = vec3(0.0);
          float heatWeight = 0.0;

          for (int i = 0; i < 20; i++) {
            float risk = uHeatRisks[i];

            float r    = uHeatRadii[i];
            float dist = distance(vWorldPos, uHeatCenters[i]);
            if (dist >= r) continue;

            float factor = pow(1.0 - smoothstep(0.0, r, dist), 1.8);

            // Pulse on high-risk zones
            if (risk > 60.0) factor *= 0.80 + 0.20 * sin(uTime * 4.2);
            if (i == uSelectedZoneIdx) factor *= 1.6;

            vec3 heatCol = vec3(0.06, 0.73, 0.51); // Green base for healthy (0-30%)
            if (risk > 60.0) {
              float t2 = clamp((risk - 60.0) / 40.0, 0.0, 1.0);
              heatCol = mix(vec3(0.96, 0.62, 0.07), vec3(0.95, 0.15, 0.15), t2); // Yellow to Red
            } else if (risk > 30.0) {
              float t2 = clamp((risk - 30.0) / 30.0, 0.0, 1.0);
              heatCol = mix(vec3(0.06, 0.73, 0.51), vec3(0.96, 0.62, 0.07), t2); // Green to Yellow
            }

            heatAccum  += heatCol * factor;
            heatWeight  = max(heatWeight, factor);
          }

          if (heatWeight > 0.001) {
            float blendAlpha = clamp(heatWeight * uHeatOpacity * 0.65, 0.0, 0.70);
            gl_FragColor.rgb += heatAccum * blendAlpha * 1.4;
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
      node.material = skinMat;
    });

    return { cloned: c, jointPositions: positions };
  }, [obj, userHeight, preset]);

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

  return (
    <group>
      <primitive object={cloned} />

      {/* Invisible spheres for raycasting clicks and hovers */}
      {HEAT_ZONES.map((zone) => {
        const pos = jointPositions[zone];
        if (!pos) return null;
        const risk = riskData[zone];
        if (risk == null && selectedZone !== zone) return null;

        return (
          <group key={zone} position={pos}>
            <mesh 
              visible={false}
              onClick={(e) => { e.stopPropagation(); onZoneClick(zone); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
              onPointerOut={() => { document.body.style.cursor = "auto"; }}
            >
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial />
            </mesh>
            {selectedZone === zone && (
              <InfoCard 
                zoneId={zone} 
                risk={risk || 0} 
                confidence={confidenceData?.[zone] || "medium"} 
                position={[0, 0, 0]} 
              />
            )}
          </group>
        );
      })}

      {/* ── Clinic insight markers ─────────────────────────────────── */}
      {regionalInsights.map((group) => {
        const pos = jointPositions[group.zone];
        if (!pos) return null;
        return (
          <group key={`clinic-${group.zone}`} position={pos}>
            <ClinicInsightMarker group={group} position={[0, 0, 0]} />
          </group>
        );
      })}
    </group>
  );
}

// ── 3D Asset Loading Overlay ───────────────────────────────────────────────
function ModelLoadingOverlay() {
  return (
    <Html center zIndexRange={[100, 0]}>
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-black/85 backdrop-blur-2xl border border-cyan-500/30 text-white shadow-2xl min-w-[240px] text-center anim-fade">
        <div className="relative w-14 h-14 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <Sparkles className="w-5 h-5 text-cyan-400 absolute" />
        </div>
        <div className="text-xs font-black uppercase tracking-wider text-cyan-300">Loading 3D Twin Mesh</div>
        <div className="text-[10px] text-slate-400 mt-1">Calibrating anatomical geometry...</div>
      </div>
    </Html>
  );
}

// ── Main HoloModel3D Viewport ─────────────────────────────────────────────────
export default function HoloModel3D(props: HoloModel3DProps) {
  const [heatMapEnabled, setHeatMapEnabled] = useState(true);
  const [preset, setPreset] = useState<SkinPreset>("ecorche");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const activeMode = props.viewMode ?? "3d";
  const regionalInsights = props.regionalInsights ?? [];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cyclePreset = () =>
    setPreset(p => p === "ecorche" ? "clay" : p === "clay" ? "realistic" : p === "realistic" ? "anatomy" : p === "anatomy" ? "thermal" : "ecorche");

  // Adaptive camera position for mobile portrait vs desktop landscape
  const cameraPos: [number, number, number] = isMobile ? [0, 0.82, 3.9] : [0, 0.95, 2.8];
  const cameraFov = isMobile ? 48 : 40;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: "#3e424a" }}>
      <div className="absolute inset-0 pointer-events-none z-10" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(20,23,28,0.60) 100%)" }} />
      {activeMode === "scan" ? (
        <HoloOverlay {...props} />
      ) : (
        <>
          <Canvas 
            shadows={!isMobile} 
            camera={{ position: cameraPos, fov: cameraFov }} 
            gl={{ 
              antialias: true, 
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping, 
              toneMappingExposure: 1.15 
            }}
          >
            <color attach="background" args={["#484d56"]} />
            <ambientLight intensity={0.7} color="#edf1f7" />
            <directionalLight position={[2.2, 4.0, 3.2]} intensity={3.8} color="#ffffff" castShadow={!isMobile} />
            <directionalLight position={[-2.4, 2.0, 2.2]} intensity={2.0} color="#dce6f2" />
            <directionalLight position={[0.2, 2.8, -3.0]} intensity={2.8} color="#f4e8e1" />
            <pointLight position={[0, 0.6, 1.8]} intensity={1.0} color="#f5e6de" />
            
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow={!isMobile}>
              <planeGeometry args={[6, 6]} />
              <shadowMaterial opacity={0.35} />
            </mesh>

            <Suspense fallback={<ModelLoadingOverlay />}>
              <RealHumanoid3D {...props} heatMapEnabled={heatMapEnabled} preset={preset} regionalInsights={regionalInsights} />
            </Suspense>

            <OrbitControls 
              target={[0, 0.85, 0]} 
              enablePan={false} 
              minPolarAngle={Math.PI / 6} 
              maxPolarAngle={Math.PI / 1.6} 
              minDistance={1.2} 
              maxDistance={5.0} 
              dampingFactor={0.06} 
              enableDamping 
            />
            
            {!isMobile && (
              <EffectComposer>
                <Bloom luminanceThreshold={0.80} luminanceSmoothing={0.9} intensity={0.25} height={256} />
                <Vignette eskil={false} offset={0.35} darkness={0.50} />
              </EffectComposer>
            )}
          </Canvas>

          {/* Preset Controls */}
          <div className="absolute top-16 md:top-20 left-4 md:left-6 z-20 flex flex-row md:flex-col gap-2 pointer-events-auto">
            <button onClick={() => setHeatMapEnabled(p => !p)} className={`px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold flex items-center gap-1.5 backdrop-blur-xl border shadow-lg transition-all cursor-pointer ${heatMapEnabled ? "bg-orange-500/20 border-orange-400/50 text-orange-300 shadow-orange-500/15" : "bg-black/60 border-white/10 text-gray-400 hover:text-white"}`}>
              <Flame className={`w-3.5 h-3.5 ${heatMapEnabled ? "text-orange-400 animate-pulse" : "text-gray-500"}`} /> Heat Map {heatMapEnabled ? "ON" : "OFF"}
            </button>
            <button onClick={cyclePreset} className="px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold flex items-center gap-1.5 bg-black/60 border border-white/10 text-gray-300 hover:text-white backdrop-blur-xl shadow-lg transition-all cursor-pointer">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> {SKIN_PRESETS[preset].label}
            </button>
          </div>

          <div className="hidden md:flex absolute bottom-4 left-4 z-20 pointer-events-none items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl text-[11px] text-white/60 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Digital Twin · Real-time kinematic strain analysis active</span>
          </div>
        </>
      )}
    </div>
  );
}
