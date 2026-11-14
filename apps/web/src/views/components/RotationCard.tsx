/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowDown, ArrowRight, ArrowUp, Drop, Equals, Scales, type Icon } from '@phosphor-icons/react';
import { CROPS, SCORED_PRIORITIES, type Priority, type Provenance } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import type { StrategyView } from '@/controllers/useRotationComparison';
import { formatInt } from '@/views/format';
import { NoteList } from './NoteList';
import { SourceTag } from './SourceTag';
import { YearStrip } from './YearStrip';

interface Props {
  s: StrategyView;
  weights: { priority: Priority; weight: number }[];
  climate?: Provenance;
}

function WaterHeadline({ s }: { s: StrategyView }) {
  const { t } = useTranslation();
  if (s.plan.kind === 'existing') return <p className="headline-number">{t('rotations.baseline')}</p>;
  const pct = s.waterPct;
  const I: Icon = pct <= -3 ? ArrowDown : pct >= 3 ? ArrowUp : Equals;
  const text = pct <= -3 ? t('rotations.lessWater', { pct: -pct }) : pct >= 3 ? t('rotations.moreWater', { pct }) : t('rotations.sameWater');
  return (
    <p className="headline-number">
      <Drop size={32} aria-hidden />
      <I size={24} weight="bold" aria-hidden />
      <span>{text}</span>
      <span className="headline-sub">{t('rotations.waterVs')}</span>
    </p>
  );
}

export function RotationCard({ s, weights, climate }: Props) {
  const { t } = useTranslation();
  const existing = s.plan.kind === 'existing';
  const title = s.plan.slots.map((x) => t('crops.' + x.crop));

  // Trade-off: gains and losses vs the existing rotation (never shown by colour alone)
  const gains: string[] = [];
  const losses: string[] = [];
  if (!existing) {
    if (s.waterPct <= -3) gains.push(t('rotations.gains.water'));
    if (s.waterPct >= 3) losses.push(t('rotations.losses.water'));
    if (s.bareDelta <= -7) gains.push(t('rotations.gains.bare'));
    if (s.bareDelta >= 7) losses.push(t('rotations.losses.bare', { days: s.bareDelta }));
    if (s.legumeDaysDelta >= 30) gains.push(t('rotations.gains.legume'));
    if (s.legumeDaysDelta <= -30) losses.push(t('rotations.losses.legume'));
  }
  const fao: Provenance = { source: 'FAO-56 Kc × NASA POWER ET0', kind: 'model', date: '1991–2020' };

  return (
    <article className={'card light rotation-card' + (existing ? ' is-existing' : '')}>
      <header className="rotation-head">
        <span className="tag">{existing ? t('rotations.existing') : t('rotations.alternative')}</span>
        <span className="rank">{t('rotations.rank', { rank: s.rank })}</span>
      </header>
      <h2 className="rotation-title">
        {title.map((c, i) => (
          <span key={c + i}>
            {i > 0 && <ArrowRight size={16} aria-label="then" />} {c}
          </span>
        ))}
      </h2>

      <WaterHeadline s={s} />
      <p className="small">
        {t('rotations.mmEstimate', { mm: formatInt(s.metrics.water.mm), low: formatInt(s.metrics.water.low), high: formatInt(s.metrics.water.high) })}{' '}
        <SourceTag provenance={fao} />
      </p>

      <ul className="delta-list">
        <li>
          {existing
            ? t('rotations.bareDays', { days: s.metrics.bareDays })
            : s.bareDelta > 0
              ? t('rotations.bareMore', { days: s.bareDelta })
              : s.bareDelta < 0
                ? t('rotations.bareLess', { days: -s.bareDelta })
                : t('rotations.bareSame')}
        </li>
        {!existing && s.legumeDaysDelta !== 0 && (
          <li>
            {s.legumeDaysDelta > 0
              ? t('rotations.legumeMore', { days: s.legumeDaysDelta })
              : t('rotations.legumeLess', { days: -s.legumeDaysDelta })}
          </li>
        )}
      </ul>

      {!existing && (
        <p className="tradeoff">
          <Scales size={24} aria-hidden />
          <span>
            {gains.length && losses.length
              ? t('rotations.tradeoff', { gains: gains.join(', '), losses: losses.join(', ') })
              : gains.length
                ? gains.join(', ')
                : losses.length
                  ? losses.join(', ')
                  : t('rotations.tradeoffNone')}
          </span>
        </p>
      )}

      <YearStrip months={s.months} />

      <h3 className="small-head">{t('rotations.scoresTitle')}</h3>
      <p className="small">{t('rotations.scoresHint')}</p>
      <ul className="score-list">
        {(weights.length ? weights : SCORED_PRIORITIES.map((p) => ({ priority: p, weight: 1 }))).map(({ priority, weight }) => {
          const v = s.scores[priority];
          return (
            <li key={priority}>
              <span className="score-label">
                {t(`priorities.${priority}.name`)} <span className="chip-weight">×{weight}</span>
              </span>
              {v === null ? (
                <span className="small">{t('rotations.notScored')}</span>
              ) : (
                <span className="score-bar" role="img" aria-label={`${Math.round(v * 100)}%`}>
                  <span style={{ width: `${Math.round(v * 100)}%` }} />
                  <em>{Math.round(v * 100)}%</em>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {(
        [
          ['why', s.why],
          ['evidence', s.evidence],
          ['benefits', s.benefits],
          ['gaps', s.gaps],
          ['risks', s.risks],
        ] as const
      ).map(([k, notes]) =>
        notes.length ? (
          <details key={k} className={'note-section' + (k === 'risks' ? ' risks' : '')} open={k === 'why' || k === 'risks'}>
            <summary>
              {t('rotations.' + k)} ({notes.length})
            </summary>
            <NoteList notes={notes} climate={climate} />
          </details>
        ) : null,
      )}
      <p className="sr-only">{s.plan.slots.map((x) => CROPS[x.crop].name).join(' then ')}</p>
    </article>
  );
}
