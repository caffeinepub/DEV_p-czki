import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import type { Mesh } from "three";

interface DonutTorusProps {
  position: [number, number, number];
  radius: number;
  tube: number;
  color: string;
  rotationOffset?: number;
  index: number;
}

export default function DonutTorus({
  position,
  radius,
  tube,
  color,
  index,
  rotationOffset = 0,
}: DonutTorusProps) {
  const meshRef = useRef<Mesh>(null);
  const [isPopping, setIsPopping] = useState(false);
  const popStartRef = useRef<number>(0);

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
    if (!meshRef.current) return;

    // Individual idle rotation
    meshRef.current.rotation.x +=
      0.003 + index * 0.0005 + rotationOffset * 0.001;
    meshRef.current.rotation.y +=
      0.005 + index * 0.0008 + rotationOffset * 0.002;

    // Pop animation
    if (isPopping) {
      const elapsed = (performance.now() - popStartRef.current) / 1000;
      const duration = 0.4;
      if (elapsed >= duration) {
        meshRef.current.scale.setScalar(1);
        setIsPopping(false);
      } else {
        const t = elapsed / duration;
        // Quick scale up then bounce back
        const scale =
          t < 0.3
            ? 1 + (1.3 - 1) * (t / 0.3)
            : 1 + (1.3 - 1) * (1 - (t - 0.3) / 0.7);
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh elements do not support keyboard events
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      <torusGeometry args={[radius, tube, 32, 64]} />
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
    </mesh>
  );
}
