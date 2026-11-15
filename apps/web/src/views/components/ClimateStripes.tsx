/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useMemo, useState, type KeyboardEvent } from 'react';
import { climateStripes } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import { useClimate } from '@/controllers/useClimate';

/** Diverging blue-white-red (ColorBrewer RdBu ends), symmetric around the 1991-2020 mean. */
const BLUE = [33, 102, 172];
const WHITE = [247, 247, 247];
const RED = [178, 24, 43];

function stripeColour(a: number, maxAbs: number): string {
  const t = Math.max(-1, Math.min(1, a / (maxAbs || 1)));
  const end = t < 0 ? BLUE : RED;
  const k = Math.abs(t);
  const c = WHITE.map((w, i) => Math.round(w + (end[i]! - w) * k));
  return `rgb(${c.join(',')})`;
}

/** "Warming stripes" for the pinned place: one stripe per complete year 1990-2025 (NASA POWER). */
export function ClimateStripes({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const { data } = useClimate();
  const st = useMemo(() => (data ? climateStripes(data.series) : null), [data]);
  const [sel, setSel] = useState<number | null>(null);
  if (!st) return null;

  const n = st.years.length;
  const cur = sel !== null ? st.years[sel] : null;
  const fmt = (x: number) => (x > 0 ? '+' : x < 0 ? '−' : '±') + Math.abs(x).toFixed(1);
  const describe = (i: number) => {
    const v = st.years[i]!;
    return t('stripes.value', { year: v.year, mean: v.meanC.toFixed(1), diff: fmt(v.anomalyC) });
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    const j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
    if (j === null) return;
    e.preventDefault();
    const k = Math.max(0, Math.min(n - 1, j));
    setSel(k);
    (e.currentTarget.parentElement?.children[k] as HTMLElement | undefined)?.focus();
  };
  const focusIdx = sel ?? n - 1;

  return (
    <figure className={'card light stripes-card ' + className}>
      <figcaption className="stripes-title">{t('stripes.title', { from: st.years[0]!.year, to: st.years[n - 1]!.year })}</figcaption>
      <div className="stripes" role="group" aria-label={t('stripes.aria')} onMouseLeave={() => setSel(null)}>
        {st.years.map((v, i) => (
          <button
            key={v.year}
            type="button"
            className={'stripe' + (sel === i ? ' is-sel' : '')}
            style={{ background: stripeColour(v.anomalyC, st.maxAbsC) }}
            aria-label={describe(i)}
            aria-pressed={sel === i}
            tabIndex={i === focusIdx ? 0 : -1}
            onMouseEnter={() => setSel(i)}
            onFocus={() => setSel(i)}
            onClick={() => setSel(i)}
            onKeyDown={(e) => onKey(e, i)}
          />
        ))}
      </div>
      <div className="stripes-axis small" aria-hidden>
        <span>{st.years[0]!.year}</span>
        <span>{st.years[n - 1]!.year}</span>
      </div>
      <p className="stripes-readout" aria-live="polite">
        {cur ? describe(sel!) : t('stripes.hint', { normal: st.normalC.toFixed(1) })}
      </p>
      <p className="stripes-legend small">
        <span className="stripes-key" aria-hidden>
          <span style={{ background: stripeColour(-1, 1) }} />
          <span style={{ background: stripeColour(0, 1) }} />
          <span style={{ background: stripeColour(1, 1) }} />
        </span>
        {t('stripes.legend')}
      </p>
      <p className="stripes-credit small">
        {t('stripes.creditPrefix')}{' '}
        <a href="https://showyourstripes.info/" target="_blank" rel="noreferrer">#ShowYourStripes</a> by Ed Hawkins (
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>)
      </p>
    </figure>
  );
}
