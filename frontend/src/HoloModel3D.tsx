import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

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
}

import HoloOverlay from "./HoloOverlay";

// Standard React ErrorBoundary to catch 404s when model.glb is missing
class ModelErrorBoundary extends React.Component<{ props: HoloModel3DProps, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { props: HoloModel3DProps, children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Html fullscreen zIndexRange={[10, 0]}>
          <div className="absolute inset-0 w-full h-full pointer-events-auto">
            <HoloOverlay {...this.props.props} />
                        {/* Small subtle notice to user */}
              <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md text-[10px] text-white/50 z-50">
                2D Fallback. Drop <code className="text-primary font-mono bg-white/10 px-1 rounded">model.glb</code> in public/ for 3D.
              </div>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

function getMaterial(risk: number = 0, isSelected: boolean = false) {
  let color = new THREE.Color("#00f0ff"); // default cyan
  let emissiveIntensity = 0.5;

  if (risk >= 70) {
    color = new THREE.Color("#ef4444");
    emissiveIntensity = 2.0;
  } else if (risk >= 55) {
    color = new THREE.Color("#f59e0b");
    emissiveIntensity = 1.5;
  } else if (risk >= 35) {
    color = new THREE.Color("#10b981");
    emissiveIntensity = 0.8;
  }

  if (isSelected) emissiveIntensity *= 1.5;

  return new THREE.MeshPhysicalMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: emissiveIntensity,
    transparent: true,
    opacity: 0.6,
    transmission: 0.9, 
    roughness: 0.1,
    metalness: 0.5,
    wireframe: false,
    side: THREE.DoubleSide,
    depthWrite: false, 
  });
}

function Model({ riskData = {}, selectedZone, onZoneClick }: HoloModel3DProps) {
  const { scene } = useGLTF("/model.glb");
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useMemo(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        let matchedZone: ZoneId | undefined;

        // Example fuzzy matching - the user would tailor this to their specific .glb mesh names
        if (name.includes("head") || name.includes("skull")) matchedZone = "head";
        else if (name.includes("knee") && name.includes("left")) matchedZone = "left_knee";
        else if (name.includes("lumbar") || name.includes("spine")) matchedZone = "lumbar";
        
        if (matchedZone) {
          const risk = riskData[matchedZone] ?? 0;
          mesh.material = getMaterial(risk, selectedZone === matchedZone);
          mesh.userData.zoneId = matchedZone; 
        } else {
          mesh.material = getMaterial(0, false);
        }
      }
    });
  }, [clonedScene, riskData, selectedZone]);

    return (
      <primitive 
        object={clonedScene} 
        position={[0, -1.8, 0]} 
        scale={1.0}
        onClick={(e: any) => {
        e.stopPropagation();
        if (e.object.userData.zoneId) {
          onZoneClick(e.object.userData.zoneId as ZoneId);
        }
      }}
    />
  );
}

export default function HoloModel3D(props: HoloModel3DProps) {
  return (
    <div className="absolute inset-0 z-0 bg-background">
      <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
        <color attach="background" args={["#0f172a"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        
        <ModelErrorBoundary props={props}>
          <Suspense fallback={null}>
            <Model {...props} />
          </Suspense>
        </ModelErrorBoundary>

        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.5} 
          minDistance={2} 
          maxDistance={10} 
        />
        
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.4} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
