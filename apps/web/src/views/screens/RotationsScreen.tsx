/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowClockwise } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useRotationComparison } from '@/controllers/useRotationComparison';
import { ErrorText } from '@/views/components/ErrorText';
import { JudgmentFlag } from '@/views/components/JudgmentFlag';
import { NeedPin } from '@/views/components/NeedPin';
import { PriorityPicker } from '@/views/components/PriorityPicker';
import { RotationCard } from '@/views/components/RotationCard';
import { ScienceToggle } from '@/views/components/Science';
import { CaseStudyNote } from '@/views/components/CaseStudy';
import { ShareButton } from '@/views/components/ShareButton';

export function RotationsScreen() {
  const { t } = useTranslation();
  const r = useRotationComparison();
  if (!r.pin)
    return (
      <section className="screen">
        <h1>{t('rotations.title')}</h1>
        <NeedPin />
      </section>
    );
  return (
    <section className="screen">
      <h1>{t('rotations.title')}</h1>
      <p className="lead">{t('rotations.intro')}</p>
      <div className="screen-tools">
        <ScienceToggle />
      </div>
      <CaseStudyNote />

      {/* Collapsed to one line so the first rotation card shows on the first phone screen. */}
      <details className="card weights-card disclosure">
        <summary>
          <span className="weights-line">
            <span className="weights-label">{t('rotations.rankedFor')}</span>{' '}
            {r.farm.priorities.length ? (
              r.farm.priorities.map((p, i) => (
                <span key={p} className="weights-item">
                  <span className="chip-rank">{i + 1}</span> {t(`priorities.${p}.name`)}
                </span>
              ))
            ) : (
              <span className="weights-item">{t('rotations.allEqual')}</span>
            )}
          </span>
          <span className="weights-change">{t('rotations.change')}</span>
        </summary>
        <p className="small">{t('rotations.weightsHint')}</p>
        <PriorityPicker value={r.farm.priorities} onChange={r.setPriorities} />
        {r.farm.priorities.length === 0 && <p className="small">{t('rotations.noPriorities')}</p>}
        <p className="small"><JudgmentFlag reason={t('rotations.marketNote')} /></p>
      </details>

      {r.isLoading && <p className="card light" role="status">{t('rotations.loading')}</p>}
      {r.isError && (
        <>
          <ErrorText>{t('season.error')}</ErrorText>
          <button className="btn btn-secondary" onClick={r.retry}>
            <ArrowClockwise size={24} aria-hidden /> {t('season.retry')}
          </button>
        </>
      )}
      <div className="rotation-list" aria-live="polite">
        {r.strategies.map((s) => (
          <RotationCard key={s.plan.id} s={s} weights={r.weights} climate={r.provenance} hazards={r.hazards} peers={r.strategies} salty={r.farm.soil.salty} />
        ))}
      </div>
      {r.strategies.length > 0 && <ShareButton strategies={r.strategies} />}
    </section>
  );
}
