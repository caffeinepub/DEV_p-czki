import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import type React from "react";
import {
  Suspense,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import type { Group } from "three";
import DonutTorus from "./DonutTorus";

const DONUT_CONFIGS = [
  {
    position: [0, 0, 0] as [number, number, number],
    radius: 1.1,
    tube: 0.38,
    color: "#FFB3C6",
    frostingColor: "#FF6B9D",
  },
  {
    position: [2.4, 0.6, -0.5] as [number, number, number],
    radius: 0.9,
    tube: 0.32,
    color: "#5C3317",
    frostingColor: "#8B5E3C",
  },
  {
    position: [-2.2, 0.4, 0.3] as [number, number, number],
    radius: 0.8,
    tube: 0.3,
    color: "#F5F0E8",
    frostingColor: "#FFFFFF",
  },
  {
    position: [1.0, -1.8, 0.8] as [number, number, number],
    radius: 0.7,
    tube: 0.28,
    color: "#CC2222",
    frostingColor: "#FF4444",
  },
  {
    position: [-1.2, -1.6, -0.4] as [number, number, number],
    radius: 1.0,
    tube: 0.36,
    color: "#F5D06A",
    frostingColor: "#FFE566",
  },
  {
    position: [2.0, -1.0, 1.2] as [number, number, number],
    radius: 0.65,
    tube: 0.27,
    color: "#E8834A",
    frostingColor: "#F4A261",
  },
  {
    position: [-2.0, -0.8, -1.0] as [number, number, number],
    radius: 0.75,
    tube: 0.29,
    color: "#D4497A",
    frostingColor: "#E040FB",
  },
];

const ROTATION_OFFSETS: number[] = [0.2, 0.8, 0.4, 1.2, 0.6, 0.1, 0.9];

interface ClusterProps {
  groupRef: React.RefObject<Group | null>;
}

function Cluster({ groupRef }: ClusterProps) {
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.12;
    groupRef.current.rotation.x += delta * 0.04;
  });

  return (
    <group ref={groupRef}>
      {DONUT_CONFIGS.map((cfg, i) => (
        <DonutTorus
          key={cfg.color}
          position={cfg.position}
          radius={cfg.radius}
          tube={cfg.tube}
          color={cfg.color}
          frostingColor={cfg.frostingColor}
          rotationOffset={ROTATION_OFFSETS[i]}
          index={i}
        />
      ))}
    </group>
  );
}

export interface DonutSceneHandle {
  resetAll: () => void;
}

const DonutScene = forwardRef<DonutSceneHandle, { onReady?: () => void }>(
  ({ onReady }, ref) => {
    const orbitRef = useRef<React.ElementRef<typeof OrbitControls>>(null);
    const groupRef = useRef<Group | null>(null);

    useImperativeHandle(ref, () => ({
      resetAll: () => {
        // Reset group rotation
        if (groupRef.current) {
          groupRef.current.rotation.set(0, 0, 0);
        }
        // Reset camera
        if (orbitRef.current) {
          orbitRef.current.reset();
        }
      },
    }));

    const handleCanvasCreated = useCallback(() => {
      onReady?.();
    }, [onReady]);

    const handleDoubleClick = useCallback(() => {
      if (orbitRef.current) {
        orbitRef.current.reset();
      }
    }, []);

    return (
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        shadows
        style={{ width: "100%", height: "100%" }}
        onCreated={handleCanvasCreated}
        onDoubleClick={handleDoubleClick}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 8, 4]}
            intensity={1.4}
            color="#FFD8A8"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight
            position={[-6, -3, 2]}
            intensity={0.5}
            color="#A8C8FF"
          />
          <pointLight position={[0, 5, 0]} intensity={0.3} color="#FF88AA" />

          <Environment preset="city" />

          <Cluster groupRef={groupRef} />

          <OrbitControls
            ref={orbitRef}
            minDistance={2}
            maxDistance={15}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.7}
          />
        </Suspense>
      </Canvas>
    );
  },
);

DonutScene.displayName = "DonutScene";
export default DonutScene;
