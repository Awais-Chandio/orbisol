/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
/**
 * Decorative WebGL globe for the Field hero (cobe, ~13 kB). Spins slowly, then eases round to show Pakistan with a
 * marker on the pinned field. Loaded lazily by HeroGlobe; never rendered under reduced motion or without WebGL.
 * cobe v2 has no render loop of its own: `update()` draws once, so the animation is a requestAnimationFrame loop here
 * that stops once the globe has settled (no idle GPU work).
 */
import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

const SPIN_MS = 2200; // free spin before turning to the field
const TURN_MS = 2400; // ease from wherever the spin got to onto the field
const SPIN_RATE = 0.0006; // rad/ms (~one turn per 10 s)

/** cobe's (phi, theta) that puts a lat/lon at the centre of the visible disc. */
function angles(lat: number, lon: number): [number, number] {
  return [Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];
}
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** Shortest signed distance from a to b on the circle. */
const shortest = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/* Brand palette as 0-1 RGB (tokens.css). */
const BLUE_YONDER: [number, number, number] = [0x2e / 255, 0x96 / 255, 0xf5 / 255];
const NEON_YELLOW: [number, number, number] = [0xea / 255, 0xfe / 255, 0x07 / 255];
const ELECTRIC_BLUE: [number, number, number] = [0x00 / 255, 0x42 / 255, 0xa6 / 255];

export interface FieldGlobeProps {
  lat: number;
  lon: number;
  /** CSS pixel size of the square canvas. */
  size: number;
  /** Called if WebGL cannot be set up, so the caller can show the SVG orbit instead. */
  onFail: () => void;
}

export default function FieldGlobe({ lat, lon, size, onFail }: FieldGlobeProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const [targetPhi, targetTheta] = angles(lat, lon);
    // Start a third of a turn away so there is always a visible swing onto the field.
    let phi = targetPhi + (2 * Math.PI) / 3;
    const startTheta = 0.25;
    let globe: ReturnType<typeof createGlobe>;
    try {
      globe = createGlobe(canvas, {
        width: size,
        height: size,
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        phi,
        theta: startTheta,
        dark: 1,
        diffuse: 1.6,
        mapSamples: 14000,
        mapBrightness: 9,
        mapBaseBrightness: 0.08,
        baseColor: BLUE_YONDER,
        markerColor: NEON_YELLOW,
        glowColor: ELECTRIC_BLUE,
        markers: [{ location: [lat, lon], size: 0.08 }],
        scale: 1,
      });
    } catch {
      onFailRef.current();
      return;
    }
    // cobe returns no-op handles when it cannot get a WebGL context: fall back to the SVG orbit.
    if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) {
      globe.destroy();
      onFailRef.current();
      return;
    }

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let turnFrom = 0;
    let turnStart = 0;
    const frame = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const elapsed = now - t0;
      let theta = startTheta;
      if (elapsed < SPIN_MS) {
        phi += SPIN_RATE * dt;
      } else {
        if (!turnStart) {
          turnStart = now;
          turnFrom = phi;
        }
        const k = Math.min((now - turnStart) / TURN_MS, 1);
        const e = easeInOut(k);
        phi = turnFrom + shortest(turnFrom, targetPhi + 2 * Math.PI) * e;
        theta = startTheta + (targetTheta - startTheta) * e;
        if (k >= 1) {
          globe.update({ phi: targetPhi, theta: targetTheta });
          raf = 0;
          return; // settled: stop drawing
        }
      }
      globe.update({ phi, theta });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      globe.destroy();
    };
  }, [lat, lon, size]);

  return <canvas ref={ref} className="hero-globe-canvas" style={{ width: size, height: size }} />;
}
