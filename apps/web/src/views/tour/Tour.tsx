/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, X } from '@phosphor-icons/react';
import { DEMO_FIELD } from '@/config/env';
import type { FieldPin } from '@/models/field';
import { roundCoord } from '@/models/field';
import { useFieldStore } from '@/stores/fieldStore';
import { useRotationComparison } from '@/controllers/useRotationComparison';
import { useHeat2050 } from '@/controllers/useHeat2050';
import { barePlain, heatPlain, tradeoffText, waterPlain } from '@/views/plain';
import { useScience } from '@/views/components/Science';
import { useReducedMotion } from '@/views/useReducedMotion';

/**
 * 60-second guided tour: pins the Hyderabad demo farm and walks through five real screens, highlighting the real
 * element on each. Presentation only: every number comes from the same app state the screens use.
 */

const SEEN_KEY = 'orbisol.tourSeen';
function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* private mode or blocked storage: the tour may show again, nothing breaks */
  }
}

const TourCtx = createContext<{ start: () => void }>({ start: () => {} });
export const useTour = () => useContext(TourCtx);

export function TourProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<Element | null>(null);
  const before = useRef<FieldPin | null>(null);
  const start = useCallback(() => {
    opener.current = document.activeElement;
    before.current = useFieldStore.getState().pin;
    markSeen();
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    // Put the farmer's own field back if the tour replaced it with the demo farm.
    const prev = before.current;
    const now = useFieldStore.getState().pin;
    if (prev && now && (prev.lat !== now.lat || prev.lon !== now.lon)) useFieldStore.getState().setPin(prev);
    const el = opener.current;
    requestAnimationFrame(() => {
      if (el instanceof HTMLElement && el.isConnected) el.focus();
      else document.querySelector<HTMLElement>('main h1')?.focus();
    });
  }, []);

  // First-time visitor (never seen the tour, no field pinned yet): show it once, automatically.
  useEffect(() => {
    if (!readSeen() && !useFieldStore.getState().pin) start();
  }, [start]);

  const value = useMemo(() => ({ start }), [start]);
  return (
    <TourCtx.Provider value={value}>
      {children}
      {open && <TourOverlay onClose={close} />}
    </TourCtx.Provider>
  );
}

interface Step {
  path: string;
  /** CSS selectors tried in order; the first one on the page is highlighted. */
  targets: string[];
  title: string;
  body: string[];
  ready: boolean;
}

function useSteps(): Step[] {
  const { t } = useTranslation();
  const r = useRotationComparison();
  const heat = useHeat2050();
  const ex = r.strategies[0];
  const best = r.strategies[1];
  const crops = best ? best.plan.slots.map((x) => t('crops.' + x.crop)).join(' → ') : '';
  const loading = t('tour.loading');
  return [
    { path: '/field', targets: ['.field-map-wrap'], title: t('tour.s1.title'), body: [t('tour.s1.body')], ready: true },
    {
      path: '/overview',
      targets: ['[data-tour="overview-bare"]'],
      title: t('tour.s2.title'),
      body: [ex ? barePlain(t, ex.metrics.bareHotDays) : loading],
      ready: !!ex,
    },
    {
      path: '/calendar',
      targets: ['[data-tour="ndvi-dip"]', '.tl-ndvi-title'],
      title: t('tour.s3.title'),
      body: [t('tour.s3.body')],
      ready: !!ex,
    },
    {
      path: '/rotations',
      targets: best ? [`[data-plan="${best.plan.id}"]`, '.rotation-card:not(.is-existing)'] : ['.rotation-card:not(.is-existing)'],
      title: t('tour.s4.title'),
      body: best ? [waterPlain(t, best.waterPct, crops), tradeoffText(t, best)] : [loading],
      ready: !!best,
    },
    {
      path: '/season',
      targets: ['#heat-2050'],
      title: t('tour.s5.title'),
      body: [...(heat && heatPlain(t, heat) ? [heatPlain(t, heat)!] : []), t('tour.s5.body')],
      ready: heat !== null,
    },
  ];
}

const PAD = 8;
type Box = { top: number; left: number; width: number; height: number };

function TourOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const science = useScience();
  const steps = useSteps();
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const step = steps[i]!;
  const last = i === steps.length - 1;

  // Start: pin the demo farm and make sure the science layer (charts, 2050 card) is showing.
  useEffect(() => {
    useFieldStore.getState().setPin({
      lat: roundCoord(DEMO_FIELD.lat),
      lon: roundCoord(DEMO_FIELD.lon),
      source: 'demo',
      label: DEMO_FIELD.label,
      pinnedAt: new Date().toISOString(),
    });
    if (!science.open) science.toggle();
    // once, on open
  }, []);

  // Each step: go to its screen.
  useEffect(() => {
    if (pathname !== step.path) navigate(step.path);
  }, [i]);

  // Find the target (it may appear only after data loads), scroll it under the header, then follow it every frame.
  const scrolledFor = useRef(-1);
  const lastScroll = useRef(0);
  useLayoutEffect(() => {
    let raf = 0;
    let alive = true;
    const t0 = performance.now();
    const tick = () => {
      if (!alive) return;
      const el = step.targets.map((s) => document.querySelector(s)).find((x): x is Element => !!x) ?? null;
      if (el && pathname === step.path) {
        const r = el.getBoundingClientRect();
        const header = document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 0;
        const cardTop = card.current?.getBoundingClientRect().top ?? window.innerHeight;
        const now = performance.now();
        // Scroll once per step; for the first 2 s scroll again if the page moved it (scroll restore, late layout)
        // so the target sits under the card or above the header.
        const hidden = r.top > cardTop - 40 || r.bottom < header + 8;
        const again = hidden && now - t0 < 2000 && now - lastScroll.current > 500;
        if (r.height > 0 && (scrolledFor.current !== i || again)) {
          scrolledFor.current = i;
          lastScroll.current = now;
          window.scrollTo({ top: Math.max(0, r.top + window.scrollY - header - 16), behavior: reduce ? 'auto' : 'smooth' });
        }
        setBox((b) =>
          b && b.top === r.top - PAD && b.left === r.left - PAD && b.width === r.width + 2 * PAD && b.height === r.height + 2 * PAD
            ? b
            : { top: r.top - PAD, left: r.left - PAD, width: r.width + 2 * PAD, height: r.height + 2 * PAD },
        );
      } else if (performance.now() - t0 > 300) setBox(null);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [i, pathname, step.path, step.targets.join('|'), reduce]);

  // Focus the card on every step, so screen readers read the new step and keyboard users stay in it.
  useEffect(() => {
    card.current?.focus({ preventScroll: true });
  }, [i]);

  const next = () => (last ? onClose() : setI(i + 1));
  const back = () => setI(Math.max(0, i - 1));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !card.current) return;
    // Focus trap: Tab and Shift+Tab cycle through the card's buttons only.
    const f = [...card.current.querySelectorAll<HTMLElement>('button:not([disabled])')];
    if (!f.length) return;
    const first = f[0]!;
    const lastEl = f[f.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === card.current)) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && active === lastEl) {
      e.preventDefault();
      first.focus();
    }
  };

  const titleId = 'tour-title';
  const bodyId = 'tour-body';
  return createPortal(
    <div className={'tour' + (reduce ? '' : ' tour-anim')} onKeyDown={onKeyDown}>
      {/* Blocks the page while the tour is open; the highlight shows the real element underneath. */}
      <div className="tour-block" aria-hidden />
      {box ? (
        <div className="tour-spot" aria-hidden style={{ top: box.top, left: box.left, width: box.width, height: box.height }} />
      ) : (
        <div className="tour-dim" aria-hidden />
      )}
      <div ref={card} className="tour-card" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} tabIndex={-1}>
        <div className="tour-top">
          <p className="tour-count">{t('tour.count', { n: i + 1, total: steps.length })}</p>
          <button type="button" className="tour-skip" onClick={onClose}>
            <X size={16} aria-hidden /> {t('tour.skip')}
          </button>
        </div>
        <h2 id={titleId} className="tour-title">
          {step.title}
        </h2>
        <div id={bodyId} className="tour-body" aria-live="polite">
          {step.body.map((b, k) => (
            <p key={k}>{b}</p>
          ))}
          {!step.ready && <p className="small">{t('tour.loading')}</p>}
        </div>
        <div className="tour-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={back} disabled={i === 0}>
            <ArrowLeft size={18} aria-hidden /> {t('tour.back')}
          </button>
          <button type="button" className="btn btn-primary btn-small" onClick={next}>
            {last ? t('tour.done') : t('tour.next')} {!last && <ArrowRight size={18} aria-hidden />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
