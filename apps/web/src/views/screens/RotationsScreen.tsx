/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowClockwise } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useRotationComparison } from '@/controllers/useRotationComparison';
import { ErrorText } from '@/views/components/ErrorText';
import { JudgmentFlag } from '@/views/components/JudgmentFlag';
import { NeedPin } from '@/views/components/NeedPin';
import { PriorityPicker } from '@/views/components/PriorityPicker';
import { RotationCard } from '@/views/components/RotationCard';
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

      <div className="card weights-card">
        <h2>{t('rotations.weightsTitle')}</h2>
        <p className="small">{t('rotations.weightsHint')}</p>
        <PriorityPicker value={r.farm.priorities} onChange={r.setPriorities} />
        {r.farm.priorities.length === 0 && <p className="small">{t('rotations.noPriorities')}</p>}
        <p className="small"><JudgmentFlag reason={t('rotations.marketNote')} /></p>
      </div>

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
          <RotationCard key={s.plan.id} s={s} weights={r.weights} climate={r.provenance} hazards={r.hazards} />
        ))}
      </div>
      {r.strategies.length > 0 && <ShareButton strategies={r.strategies} />}
    </section>
  );
}
