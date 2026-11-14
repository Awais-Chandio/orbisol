/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Info, MapPinArea } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { inCaseStudy } from '@/config/caseStudy';
import { useFieldStore } from '@/stores/fieldStore';

export function useInCaseStudy() {
  const pin = useFieldStore((s) => s.pin);
  return inCaseStudy(pin);
}

/** Marks a card whose data is prepared only for the Hyderabad case study. */
export function CaseStudyBadge() {
  const { t } = useTranslation();
  return (
    <span className="case-badge">
      <MapPinArea size={14} weight="bold" aria-hidden /> {t('caseStudy.badge')}
    </span>
  );
}

/** Shown for pins outside the case study, where the Hyderabad-only cards are hidden. */
export function CaseStudyNote() {
  const { t } = useTranslation();
  const pin = useFieldStore((s) => s.pin);
  if (!pin || inCaseStudy(pin)) return null;
  return (
    <p className="case-note" role="note">
      <Info size={20} aria-hidden />
      <span>{t('caseStudy.note')}</span>
    </p>
  );
}
