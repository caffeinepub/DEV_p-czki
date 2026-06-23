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

function buildDonutTexture(
  frostingColor: string,
  seed: number,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Fill frosting base
  ctx.fillStyle = frostingColor;
  ctx.fillRect(0, 0, size, size);

  // Add subtle gloss highlight band
  const gloss = ctx.createLinearGradient(0, 0, 0, size * 0.45);
  gloss.addColorStop(0, "rgba(255,255,255,0.35)");
  gloss.addColorStop(0.5, "rgba(255,255,255,0.08)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, size, size * 0.45);

  const rng = makeRng(seed);
  const count = 32;

  for (let i = 0; i < count; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const w = 8 + rng() * 7; // 8–15 px long
    const h = 3 + rng() * 2; // 3–5 px wide
    const angle = rng() * Math.PI;
    const color = SPRINKLE_COLORS[Math.floor(rng() * SPRINKLE_COLORS.length)];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    // Draw elongated rounded rectangle
    const r = h / 2;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -r);
    ctx.lineTo(w / 2 - r, -r);
    ctx.arc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-w / 2 + r, r);
    ctx.arc(-w / 2 + r, 0, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    // Subtle highlight on top of sprinkle
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.3, w * 0.35, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
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

  const donutTexture = useMemo(
    () => buildDonutTexture(frostingColor, index * 12345 + 7),
    [frostingColor, index],
  );

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

    // Individual idle rotation
    groupRef.current.rotation.x +=
      0.003 + index * 0.0005 + rotationOffset * 0.001;
    groupRef.current.rotation.y +=
      0.005 + index * 0.0008 + rotationOffset * 0.002;

    // Pop animation
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

      {/* Frosting + sprinkles via canvas texture — covers top of torus */}
      <mesh castShadow receiveShadow position={[0, tube * 0.08, 0]}>
        <torusGeometry args={[radius * 1.04, tube * 0.72, 32, 64]} />
        <meshStandardMaterial
          map={donutTexture}
          color={0xffffff}
          roughness={0.15}
          metalness={0.4}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
}
