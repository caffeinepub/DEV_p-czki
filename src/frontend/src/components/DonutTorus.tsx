import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group } from "three";

interface DonutTorusProps {
  position: [number, number, number];
  radius: number;
  tube: number;
  color: string;
  frostingColor: string;
  rotationOffset?: number;
  index: number;
}

const SPRINKLE_COLORS = [
  "#FF2255",
  "#00CCFF",
  "#FFD700",
  "#44DD00",
  "#FF6600",
  "#CC00FF",
  "#FF99CC",
  "#00FFAA",
  "#FF4400",
  "#33AAFF",
];

// Seeded pseudo-random number generator (mulberry32)
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SprinkleData {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  color: string;
}

export default function DonutTorus({
  position,
  radius,
  tube,
  color,
  frostingColor,
  index,
  rotationOffset = 0,
}: DonutTorusProps) {
  const groupRef = useRef<Group>(null);
  const [isPopping, setIsPopping] = useState(false);
  const popStartRef = useRef<number>(0);

  // Compute 3D sprinkle positions + normals on the torus surface
  const sprinkles = useMemo<SprinkleData[]>(() => {
    const R = radius;
    const r = tube;
    const rng = makeRng(index * 12345 + 7);
    const count = 22;
    const result: SprinkleData[] = [];

    for (let i = 0; i < count; i++) {
      const u = rng() * 2 * Math.PI;
      const v = rng() * 2 * Math.PI;

      // Surface point
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const y = r * Math.sin(v);
      const z = (R + r * Math.cos(v)) * Math.sin(u);
      const surfacePoint = new THREE.Vector3(x, y, z);

      // Outward normal
      const nx = Math.cos(v) * Math.cos(u);
      const ny = Math.sin(v);
      const nz = Math.cos(v) * Math.sin(u);
      const normal = new THREE.Vector3(nx, ny, nz).normalize();

      // Position slightly above surface
      const sprinklePos = surfacePoint
        .clone()
        .addScaledVector(normal, r * 0.15 + 0.02);

      const sprinkleColor =
        SPRINKLE_COLORS[Math.floor(rng() * SPRINKLE_COLORS.length)];

      result.push({ position: sprinklePos, normal, color: sprinkleColor });
    }
    return result;
  }, [radius, tube, index]);

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (isPopping) return;
      setIsPopping(true);
      popStartRef.current = performance.now();
    },
    [isPopping],
  );

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.rotation.x +=
      0.003 + index * 0.0005 + rotationOffset * 0.001;
    groupRef.current.rotation.y +=
      0.005 + index * 0.0008 + rotationOffset * 0.002;

    if (isPopping) {
      const elapsed = (performance.now() - popStartRef.current) / 1000;
      const duration = 0.4;
      if (elapsed >= duration) {
        groupRef.current.scale.setScalar(1);
        setIsPopping(false);
      } else {
        const t = elapsed / duration;
        const scale =
          t < 0.3
            ? 1 + (1.3 - 1) * (t / 0.3)
            : 1 + (1.3 - 1) * (1 - (t - 0.3) / 0.7);
        groupRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh elements do not support keyboard events
    <group ref={groupRef} position={position} onClick={handleClick}>
      {/* Base donut body */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[radius, tube, 32, 64]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.1} />
      </mesh>

      {/* Frosting layer - 3D torus geometry, plain colored material */}
      <mesh castShadow receiveShadow position={[0, tube * 0.05, 0]}>
        <torusGeometry args={[radius * 1.02, tube * 0.85, 32, 64]} />
        <meshStandardMaterial
          color={frostingColor}
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Sprinkles - PlaneGeometry lying flat on torus surface via lookAt */}
      {sprinkles.map((s, i) => (
        <group
          // biome-ignore lint/suspicious/noArrayIndexKey: stable deterministic order
          key={i}
          ref={(ref) => {
            if (ref) {
              ref.position.copy(s.position);
              // lookAt(position + normal) aligns local Z to surface normal → plane lies FLAT
              ref.lookAt(s.position.clone().add(s.normal));
              // Rotate in-plane for visual variety using golden-angle distribution
              ref.rotateZ(((i * 1.618) % 1) * Math.PI);
            }
          }}
        >
          <mesh castShadow>
            <planeGeometry args={[0.15, 0.05]} />
            <meshStandardMaterial
              color={s.color}
              roughness={0.4}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
