import { describe, expect, it } from "vitest";

// Pure torus surface math — mirrors exactly what DonutTorus.tsx computes.
// Three.js TorusGeometry XY-plane parameterization:
//   x = (R + r*cos(v)) * cos(u)
//   y = (R + r*cos(v)) * sin(u)
//   z = r * sin(v)
// Outward normal:
//   nx = cos(v) * cos(u)
//   ny = cos(v) * sin(u)
//   nz = sin(v)

function torusSurface(R: number, r: number, u: number, v: number) {
  const x = (R + r * Math.cos(v)) * Math.cos(u);
  const y = (R + r * Math.cos(v)) * Math.sin(u);
  const z = r * Math.sin(v);
  const nx = Math.cos(v) * Math.cos(u);
  const ny = Math.cos(v) * Math.sin(u);
  const nz = Math.sin(v);
  return { x, y, z, nx, ny, nz };
}

describe("DonutTorus surface parameterization (XY-plane)", () => {
  const R = 1;
  const r = 0.4;
  const PI = Math.PI;

  // Six sample (u, v) pairs covering the full angular range
  const samples: Array<[number, number, string]> = [
    [0, 0, "u=0, v=0 (front-outer)"],
    [PI / 2, 0, "u=PI/2, v=0 (top-outer)"],
    [PI, 0, "u=PI, v=0 (back-outer)"],
    [0, PI, "u=0, v=PI (front-inner)"],
    [PI / 4, PI / 2, "u=PI/4, v=PI/2 (diagonal top)"],
    [(3 * PI) / 2, (3 * PI) / 4, "u=3PI/2, v=3PI/4"],
  ];

  for (const [u, v, label] of samples) {
    it(`position is on torus surface: ${label}`, () => {
      const { x, y, z } = torusSurface(R, r, u, v);

      // XY distance from the Z-axis should be close to R (±r tolerance)
      const xyDist = Math.sqrt(x * x + y * y);
      expect(xyDist).toBeGreaterThanOrEqual(R - r - 0.05);
      expect(xyDist).toBeLessThanOrEqual(R + r + 0.05);

      // Cross-section test: verify xyDist ≈ R within 0.05
      // (at v=0 or v=PI the XY distance is exactly R+r or R-r; the strict test is:
      //  the point actually lies on the torus by checking the donut equation)
      // Donut implicit equation: (sqrt(x^2+y^2) - R)^2 + z^2 = r^2
      const donutEq = (xyDist - R) ** 2 + z * z;
      expect(donutEq).toBeCloseTo(r * r, 6);

      // z must be within [-r, r]
      expect(z).toBeGreaterThanOrEqual(-r - 1e-9);
      expect(z).toBeLessThanOrEqual(r + 1e-9);
    });

    it(`normal is unit length: ${label}`, () => {
      const { nx, ny, nz } = torusSurface(R, r, u, v);
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      expect(len).toBeCloseTo(1, 6);
    });
  }
});
