/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useState } from 'react';
import type { HazardMonths, MonthlyGreenness, Provenance } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import type { StrategyView } from '@/controllers/useRotationComparison';
import { CropYearTimeline } from './CropYearTimeline';

interface Props {
  strategies: StrategyView[];
  hazards?: HazardMonths;
  ndvi?: MonthlyGreenness[] | null;
  ndviProvenance?: Provenance;
  ndviGap?: boolean;
}

/**
 * Current | Option 1 | Option 2 on one crop-year chart: the bars and bare gaps move to the chosen plan.
 * The MODIS greenness curve belongs to the field as farmed now, so it is shown with "Current" only.
 */
export function TimelineSwitcher({ strategies, hazards, ndvi, ndviProvenance, ndviGap }: Props) {
  const { t } = useTranslation();
  const [i, setI] = useState(0);
  const sel = strategies[Math.min(i, strategies.length - 1)];
  if (!sel) return null;
  const crops = sel.plan.slots.map((x) => t('crops.' + x.crop)).join(' → ');
  return (
    <div className="timeline-switcher">
      {strategies.length > 1 && (
        <div className="segmented segmented-light" role="group" aria-label={t('timeline.switchLabel')}>
          {strategies.map((s, k) => (
            <button key={s.plan.id} type="button" aria-pressed={k === i} onClick={() => setI(k)} title={s.plan.slots.map((x) => t('crops.' + x.crop)).join(' → ')}>
              {k === 0 ? t('timeline.current') : t('timeline.option', { n: k })}
            </button>
          ))}
        </div>
      )}
      <p className="tl-plan" aria-live="polite">
        <strong>{crops}</strong>
        <span>{t('timeline.bareHotLine', { count: sel.metrics.bareHotDays })}</span>
      </p>
      <CropYearTimeline
        slots={sel.plan.slots}
        bare={sel.metrics.bare}
        hazards={hazards}
        ndvi={i === 0 ? ndvi : null}
        ndviProvenance={ndviProvenance}
        ndviGap={i === 0 && ndviGap}
        ndviNote={i === 0 ? undefined : t('timeline.ndviCurrentOnly')}
      />
    </div>
  );
}
