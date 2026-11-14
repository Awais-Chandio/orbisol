/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useEffect, useId, useRef, useState } from 'react';
import { CloudRain, Planet, Snowflake, ThermometerHot } from '@phosphor-icons/react';
import { CROPS, YEAR_DAYS, doyToMd, type CropSlot, type HazardMonths, type MonthlyGreenness, type Provenance, type Span } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import { formatMonthDay, monthName } from '@/views/format';
import { GlossaryTip } from './GlossaryTip';
import { SourceTag } from './SourceTag';

/** First day of each month (day of year, non-leap) and the day after the year ends. */
const MONTH_START = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];

/** Summer (kharif, spring, perennial) crops electric blue, winter (rabi) crops deep blue; always labelled in text. */
const fillOf = (s: CropSlot) => (CROPS[s.crop].season === 'rabi' ? 'var(--c-deep-blue)' : 'var(--c-electric-blue)');

interface Props {
  slots: CropSlot[];
  bare: Span[];
  hazards?: HazardMonths;
  /** Monthly greenness normal (MODIS). Omitted in the compact version. */
  ndvi?: MonthlyGreenness[] | null;
  /** Credit for the greenness curve. */
  ndviProvenance?: Provenance;
  /** Shown instead of the curve when there is no greenness file for this field. */
  ndviGap?: boolean;
  compact?: boolean;
}

/** Track the rendered width so text stays at its real pixel size at every screen width. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e!.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** A day-of-year span on the circular year as one or two straight pieces [from, to] (inclusive). */
function pieces(start: number, days: number): [number, number][] {
  if (days >= YEAR_DAYS) return [[1, YEAR_DAYS]];
  const end = start + days - 1;
  return end <= YEAR_DAYS ? [[start, end]] : [[start, YEAR_DAYS], [1, end - YEAR_DAYS]];
}

/** Greedy lanes: a crop goes in the first lane it does not overlap (relay sowing gets a second lane). */
function lanes(slots: CropSlot[]): number[] {
  const used: boolean[][] = [];
  return slots.map((s) => {
    const days = pieces(s.sow, s.days).flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i));
    let lane = used.findIndex((l) => days.every((d) => !l[d]));
    if (lane < 0) lane = used.push([]) - 1;
    days.forEach((d) => (used[lane]![d] = true));
    return lane;
  });
}

const textW = (s: string, px: number) => s.length * px * 0.56;

/**
 * 12-month crop-year timeline: crop bars, hatched bare-field gaps, the hottest-months band, and (full version)
 * the MODIS monthly greenness normal underneath on the same months. Identity is in text, never colour alone.
 */
export function CropYearTimeline({ slots, bare, hazards, ndvi, ndviProvenance, ndviGap, compact = false }: Props) {
  const { t } = useTranslation();
  const uid = useId().replace(/:/g, '');
  const [ref, width] = useWidth<HTMLDivElement>();
  const W = Math.max(width, 280);
  const font = compact ? 11 : 12;
  const padL = compact ? 2 : 30;
  const padR = 2;
  const plotW = W - padL - padR;
  const x = (doy: number) => padL + ((doy - 1) / YEAR_DAYS) * plotW;
  const hot = hazards?.hot ?? [];
  const showNdvi = !compact && !!ndvi && ndvi.some((m) => Number.isFinite(m.value));

  const lane = lanes(slots);
  const nLanes = Math.max(1, ...lane.map((l) => l + 1));
  const laneH = compact ? 22 : 28;
  const top = compact ? 16 : 20; // hazard icon row
  const barsTop = top + 2;
  const barsBottom = barsTop + nLanes * laneH;
  const monthsY = barsBottom + font + 4;
  const H = monthsY + 4;
  const ndviTop = 8;
  const ndviH = 84;
  const H2 = ndviTop + ndviH + font + 8;
  const longMonths = plotW / 12 >= 34;

  const mName = (m: number) => (longMonths ? monthName(m) : monthName(m).slice(0, 1));
  const cropName = (s: CropSlot) => t('crops.' + s.crop);
  const label = (s: CropSlot) => {
    const end = (s.sow + Math.min(s.days, YEAR_DAYS) - 2) % YEAR_DAYS + 1;
    return `${cropName(s)}: ${formatMonthDay(doyToMd(s.sow))} – ${formatMonthDay(doyToMd(end))}`;
  };
  const summary = [
    ...slots.map(label),
    ...bare.map((b) => t('timeline.bareSpan', { from: formatMonthDay(doyToMd(b.start)), to: formatMonthDay(doyToMd(b.end)), days: b.days })),
    hot.length ? t('timeline.hotSummary', { months: hot.map((m) => monthName(m, 'long')).join(', ') }) : '',
  ]
    .filter(Boolean)
    .join('. ');

  // NDVI scale: 0 to the next 0.2 above the highest month (one axis, its own panel).
  const nMax = showNdvi ? Math.max(0.4, Math.ceil(Math.max(...ndvi!.filter((m) => Number.isFinite(m.value)).map((m) => m.value)) * 5) / 5) : 1;
  const ny = (v: number) => ndviTop + ndviH - (v / nMax) * ndviH;
  const mid = (m: number) => x((MONTH_START[m - 1]! + MONTH_START[m]!) / 2);
  const ndviPts = showNdvi ? ndvi!.filter((m) => Number.isFinite(m.value)) : [];
  const usesNumbers = new Set<number>();

  return (
    <figure className={'timeline' + (compact ? ' timeline-compact' : '')}>
      <div ref={ref} className="timeline-plot">
        {width > 0 && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
            <defs>
              <pattern id={`hatch-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--c-white)" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--c-deep-blue)" strokeWidth="2" />
              </pattern>
            </defs>

            {/* hottest-months band behind everything, labelled with an icon above */}
            {hot.map((m) => (
              <rect key={'hot' + m} className="tl-hot" x={x(MONTH_START[m - 1]!)} y={0} width={x(MONTH_START[m]!) - x(MONTH_START[m - 1]!)} height={barsBottom}>
                <title>{`${monthName(m, 'long')}: ${t('hazards.hot')}`}</title>
              </rect>
            ))}
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const hz = [hot.includes(m) && ThermometerHot, hazards?.heavyRain.includes(m) && CloudRain, hazards?.frost.includes(m) && Snowflake].filter(Boolean) as (typeof CloudRain)[];
              const cx = mid(m);
              const s = compact ? 12 : 14;
              return hz.map((I, k) => <I key={m + '-' + k} x={cx - (hz.length * s) / 2 + k * s} y={1} size={s} className="tl-icon" aria-hidden />);
            })}

            {/* month gridlines */}
            {MONTH_START.slice(1, 12).map((d) => (
              <line key={d} className="tl-grid" x1={x(d)} x2={x(d)} y1={barsTop} y2={barsBottom} />
            ))}

            {/* bare field: hatched, across all lanes */}
            {bare.flatMap((b) =>
              pieces(b.start, b.days).map(([a, z]) => (
                <rect key={`bare${b.start}-${a}`} x={x(a)} y={barsTop} width={Math.max(1, x(z + 1) - x(a))} height={barsBottom - barsTop - 2} fill={`url(#hatch-${uid})`} className="tl-bare">
                  <title>{t('timeline.bareSpan', { from: formatMonthDay(doyToMd(b.start)), to: formatMonthDay(doyToMd(b.end)), days: b.days })}</title>
                </rect>
              )),
            )}

            {/* crop bars, name inside when it fits, else a number keyed in the legend */}
            {slots.map((s, i) => {
              const ps = pieces(s.sow, s.days);
              const y = barsTop + lane[i]! * laneH;
              const name = cropName(s);
              const fits = ps.map(([a, z]) => textW(name, font) <= x(z + 1) - x(a) - 8);
              // name on every piece where it fits; if it fits nowhere, a number keyed in the legend
              const numbered = !fits.some(Boolean);
              if (numbered) usesNumbers.add(i);
              const longest = ps.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
              return (
                <g key={s.crop + i}>
                  {ps.map(([a, z]) => (
                    <rect key={a} x={x(a) + 1} y={y + 1} width={Math.max(2, x(z + 1) - x(a) - 2)} height={laneH - 4} rx={4} fill={fillOf(s)}>
                      <title>{label(s)}</title>
                    </rect>
                  ))}
                  {ps.map(([a, z], k) =>
                    fits[k] || (numbered && ps[k] === longest) ? (
                      <text key={'t' + a} className="tl-crop" x={(x(a) + x(z + 1)) / 2} y={y + laneH / 2 + font * 0.35 - 1} textAnchor="middle" fontSize={font}>
                        {numbered ? String(i + 1) : name}
                      </text>
                    ) : null,
                  )}
                </g>
              );
            })}

            {/* month labels */}
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <text key={'m' + m} className="tl-month" x={mid(m)} y={monthsY} textAnchor="middle" fontSize={font - 1}>
                {mName(m)}
              </text>
            ))}

          </svg>
        )}
      </div>

      {showNdvi && (
        <>
          <p className="tl-ndvi-title">
            <Planet size={20} aria-hidden /> {t('timeline.ndviCaption')} <GlossaryTip term="ndvi" />
          </p>
          <p className="small">{t('timeline.ndviHint')}</p>
          {width > 0 && (
            <svg width={W} height={H2} viewBox={`0 0 ${W} ${H2}`} role="img" aria-label={t('timeline.ndviAria', { values: ndviPts.map((p) => `${monthName(p.month)} ${p.value.toFixed(2)}`).join(', ') })}>
              {hot.map((m) => (
                <rect key={'hot' + m} className="tl-hot" x={x(MONTH_START[m - 1]!)} y={0} width={x(MONTH_START[m]!) - x(MONTH_START[m - 1]!)} height={ndviTop + ndviH} />
              ))}
              {MONTH_START.slice(1, 12).map((d) => (
                <line key={d} className="tl-grid" x1={x(d)} x2={x(d)} y1={ndviTop} y2={ndviTop + ndviH} />
              ))}
              {[0, nMax / 2, nMax].map((v) => (
                <g key={v}>
                  <line className="tl-axis" x1={padL} x2={W - padR} y1={ny(v)} y2={ny(v)} />
                  <text className="tl-tick" x={padL - 4} y={ny(v) + 4} textAnchor="end" fontSize={font - 2}>
                    {v.toFixed(1)}
                  </text>
                </g>
              ))}
              <path className="tl-ndvi" d={ndviPts.map((p, i) => `${i ? 'L' : 'M'}${mid(p.month).toFixed(1)},${ny(p.value).toFixed(1)}`).join('')} />
              {ndviPts.map((p) => (
                <circle key={p.month} className="tl-ndvi-dot" cx={mid(p.month)} cy={ny(p.value)} r={4}>
                  <title>{`${monthName(p.month, 'long')}: NDVI ${p.value.toFixed(2)} (${t('timeline.ndviUsual')})`}</title>
                </circle>
              ))}
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <text key={'mb' + m} className="tl-month" x={mid(m)} y={ndviTop + ndviH + font + 4} textAnchor="middle" fontSize={font - 1}>
                  {mName(m)}
                </text>
              ))}
            </svg>
          )}
          {ndviProvenance && <p className="small"><SourceTag provenance={ndviProvenance} /></p>}
        </>
      )}
      {!compact && !showNdvi && ndviGap && <p className="small gap-note">{t('timeline.ndviGap')}</p>}

      <figcaption>
        <ul className="tl-legend">
          {slots.map((s, i) => (
            <li key={s.crop + i}>
              <svg width="18" height="12" aria-hidden><rect width="18" height="12" rx="3" fill={fillOf(s)} /></svg>
              {usesNumbers.has(i) && <strong>{i + 1}</strong>} {cropName(s)}
            </li>
          ))}
          {bare.length > 0 && (
            <li>
              <svg width="18" height="12" aria-hidden><rect width="18" height="12" rx="3" fill={`url(#hatch-${uid})`} stroke="var(--c-deep-blue)" /></svg>
              {t('timeline.bare')}
            </li>
          )}
          {hot.length > 0 && (
            <li>
              <ThermometerHot size={16} aria-hidden /> {t('timeline.hot')}
            </li>
          )}
          {hazards && hazards.heavyRain.length > 0 && (
            <li>
              <CloudRain size={16} aria-hidden /> {t('hazards.heavyRain')}
            </li>
          )}
          {hazards && hazards.frost.length > 0 && (
            <li>
              <Snowflake size={16} aria-hidden /> {t('hazards.frost')} {!compact && <GlossaryTip term="frost" />}
            </li>
          )}
          {showNdvi && (
            <li>
              <Planet size={16} aria-hidden /> {t('timeline.ndviLegend')}
            </li>
          )}
        </ul>
      </figcaption>
    </figure>
  );
}
