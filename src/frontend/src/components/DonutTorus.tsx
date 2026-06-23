import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group } from "three";

// Warm baked dough color (bottom of torus)
const DOUGH_COLOR = new THREE.Color("#C8822A");

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
  angle: number;
}

interface NonpareilData {
  position: THREE.Vector3;
  color: string;
  detail: number;
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

  // MeshStandardMaterial with onBeforeCompile gradient injection.
  // Local object-space Z is passed as a varying; the fragment shader blends
  // DOUGH_COLOR (underside of each donut) → donut main color (top face) via smoothstep.
  // Three.js TorusGeometry lies in the XY plane with the hole along Z, so
  // position.z distinguishes the top face (positive Z) from the bottom (negative Z).
  const baseMaterial = useMemo(() => {
    const topColor = new THREE.Color(color);
    const mat = new THREE.MeshStandardMaterial({
      color: topColor,
      roughness: 0.25,
      metalness: 0.1,
    });

    // Uniforms for the gradient
    const uniforms = {
      uDoughColor: { value: DOUGH_COLOR.clone() },
      uTopColor: { value: topColor.clone() },
      uTubeRadius: { value: tube },
    };

    mat.onBeforeCompile = (shader) => {
      // Merge our uniforms into the shader
      Object.assign(shader.uniforms, uniforms);

      // Vertex: compute local object-space Z and pass as varying
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
varying float vLocalZ;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
vLocalZ = position.z;`,
        );

      // Fragment: blend dough color with the base map color
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
varying float vLocalZ;
uniform vec3 uDoughColor;
uniform vec3 uTopColor;
uniform float uTubeRadius;`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
// remap local Z into [0,1] over the torus tube diameter
// underside = -uTubeRadius (dough), top face = +uTubeRadius (glazed)
float t = (vLocalZ + uTubeRadius) / (2.0 * uTubeRadius);
t = clamp(t, 0.0, 1.0);
// smoothstep: bottom 30% → dough, top 30% → top color, smooth middle
float blend = smoothstep(0.25, 0.75, t);
diffuseColor.rgb = mix(uDoughColor, uTopColor, blend);`,
        );
    };

    // Needed so Three.js re-compiles when color prop changes
    mat.needsUpdate = true;
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, tube]);

  // Keep uTopColor uniform in sync when color prop changes
  useEffect(() => {
    const topColor = new THREE.Color(color);
    // Access uniforms via the material's onBeforeCompile-injected uniform ref
    // We update the shared uniforms object directly since it's closed over.
    // Force a re-compile by toggling needsUpdate.
    baseMaterial.color.set(topColor);
    baseMaterial.needsUpdate = true;
  }, [color, baseMaterial]);

  // Compute 3D sprinkle positions + normals on the torus surface.
  // The donut group has rotation=[-PI/2, 0, 0], so applying Rx(-PI/2) to the
  // local normal (nx, ny, nz) gives worldNormal.y = nz.
  // Keep only candidates where nz > -0.1 (top-facing surface).
  // We generate 600+ candidate positions from a shared pool, then split
  // between sticks and nonpareils for dense coverage.
  const { sprinkles, nonpareils } = useMemo<{
    sprinkles: SprinkleData[];
    nonpareils: NonpareilData[];
  }>(() => {
    const R = radius;
    const r = tube;
    const stickRadius = 0.025;
    const stickOffset = stickRadius * 0.25; // ≈ 0.006 above surface
    const nonpareilRadius = 0.031;
    const nonpareilOffset = nonpareilRadius * 0.8;
    const rng = makeRng(index * 12345 + 7);

    const stickCount = 80;
    const nonpareilCount = 50;
    const candidatePool = 700; // generate many, filter to top-facing

    // ---- Phase 1: collect all top-facing candidate positions ----
    interface Candidate {
      u: number;
      v: number;
      surfacePoint: THREE.Vector3;
      normal: THREE.Vector3;
      nz: number;
    }
    const candidates: Candidate[] = [];

    for (let i = 0; i < candidatePool; i++) {
      const u = rng() * 2 * Math.PI;
      const v = rng() * 2 * Math.PI;

      // Surface point — Three.js XY-plane TorusGeometry parameterization
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const y = (R + r * Math.cos(v)) * Math.sin(u);
      const z = r * Math.sin(v);

      // Outward normal — XY-plane convention
      const nx = Math.cos(v) * Math.cos(u);
      const ny = Math.cos(v) * Math.sin(u);
      const nz = Math.sin(v);

      if (nz <= -0.1) continue; // bottom-facing — skip

      candidates.push({
        u,
        v,
        surfacePoint: new THREE.Vector3(x, y, z),
        normal: new THREE.Vector3(nx, ny, nz).normalize(),
        nz,
      });
    }

    // ---- Phase 2: sticks — pick first stickCount from pool ----
    // RNG calls for color + angle happen sequentially after pool generation.
    const stickResult: SprinkleData[] = [];
    for (let i = 0; i < Math.min(stickCount, candidates.length); i++) {
      const c = candidates[i];
      const sprinklePos = c.surfacePoint
        .clone()
        .addScaledVector(c.normal, stickOffset);
      const sprinkleColor =
        SPRINKLE_COLORS[Math.floor(rng() * SPRINKLE_COLORS.length)];
      const angle = rng() * Math.PI * 2;
      stickResult.push({
        position: sprinklePos,
        normal: c.normal,
        color: sprinkleColor,
        angle,
      });
    }

    // ---- Phase 3: nonpareils — pick next nonpareilCount from pool ----
    // RNG calls continue sequentially for determinism.
    const nonpareilResult: NonpareilData[] = [];
    const nonpareilStart = stickCount; // offset into candidates
    for (
      let i = nonpareilStart;
      i < Math.min(nonpareilStart + nonpareilCount, candidates.length);
      i++
    ) {
      const c = candidates[i];
      const pos = c.surfacePoint
        .clone()
        .addScaledVector(c.normal, nonpareilOffset);
      const color = SPRINKLE_COLORS[Math.floor(rng() * SPRINKLE_COLORS.length)];
      // IcosahedronGeometry detail: alternate 1/2 for variety
      const detail = i % 3 === 0 ? 2 : 1;
      nonpareilResult.push({ position: pos, color, detail });
    }

    return { sprinkles: stickResult, nonpareils: nonpareilResult };
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
      {/* Base donut body — gradient from dough (bottom) to main color (top) */}
      <mesh castShadow receiveShadow material={baseMaterial}>
        <torusGeometry args={[radius, tube, 32, 64]} />
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

      {/* Sticks (patyczki) — CylinderGeometry rods lying flat on torus surface */}
      {sprinkles.map((s, i) => (
        <group
          // biome-ignore lint/suspicious/noArrayIndexKey: stable deterministic order
          key={`stick-${i}`}
          ref={(ref) => {
            if (ref) {
              ref.position.copy(s.position);
              // lookAt(pos+normal): aligns local Z to outward normal → group XY plane is tangent to surface
              ref.lookAt(s.position.clone().add(s.normal));
              // rotateZ picks a random in-plane direction for the rod
              ref.rotateZ(s.angle);
            }
          }}
        >
          {/* Inner group rotates cylinder 90° so its long Y axis lies in the tangent plane */}
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.13, 8]} />
              <meshStandardMaterial
                color={s.color}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
          </group>
        </group>
      ))}

      {/* Nonpareils (kuleczki) — faceted IcosahedronGeometry sitting on surface */}
      {nonpareils.map((n, i) => (
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: stable deterministic order
          key={`nonpareil-${i}`}
          position={n.position}
          castShadow
        >
          <icosahedronGeometry args={[0.031, n.detail]} />
          <meshStandardMaterial
            color={n.color}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}
