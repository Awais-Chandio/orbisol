/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
/**
 * Field hero: the cobe globe when the device can run it, otherwise the SVG orbit.
 * - prefers-reduced-motion or no WebGL -> OrbitHero (static-friendly SVG), no globe code downloaded.
 * - Otherwise the globe chunk loads after first paint (idle callback), with OrbitHero shown until it is ready.
 * The marker sits on the pinned field, or the Hyderabad demo farm when nothing is pinned.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { DEMO_FIELD } from '@/config/env';
import { useFieldStore } from '@/stores/fieldStore';
import { useReducedMotion } from '@/views/useReducedMotion';
import { OrbitHero } from './OrbitHero';

const FieldGlobe = lazy(() => import('./FieldGlobe'));

const SIZE_SMALL = 160;
const SIZE_LARGE = 200;
const LARGE_QUERY = '(min-width: 900px)';

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function HeroGlobe() {
  const reduceMotion = useReducedMotion();
  const pin = useFieldStore((s) => s.pin);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState(SIZE_SMALL);

  // Defer the globe (and its chunk) until the browser is idle after first paint.
  useEffect(() => {
    if (reduceMotion || !hasWebGL()) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle: number | undefined;
    if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setReady(true));
    else timer = setTimeout(() => setReady(true), 300);
    return () => {
      if (timer) clearTimeout(timer);
      if (idle !== undefined && w.cancelIdleCallback) w.cancelIdleCallback(idle);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(LARGE_QUERY);
    const apply = () => setSize(mq.matches ? SIZE_LARGE : SIZE_SMALL);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  if (reduceMotion || failed || !ready) return <OrbitHero />;
  const lat = pin?.lat ?? DEMO_FIELD.lat;
  const lon = pin?.lon ?? DEMO_FIELD.lon;
  return (
    <div className="hero-globe" style={{ width: size, height: size }} aria-hidden>
      <Suspense fallback={<OrbitHero />}>
        <FieldGlobe lat={lat} lon={lon} size={size} onFail={() => setFailed(true)} />
      </Suspense>
    </div>
  );
}
