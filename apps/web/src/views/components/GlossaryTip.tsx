/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useId } from 'react';
import { Info, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export type GlossaryTerm = 'ndvi' | 'et0' | 'waterBalance' | 'soilAnomaly' | 'frost';

/**
 * Spans only, so it can sit inside a heading.
 * Plain-word definition behind a small info button. Native Popover API: light-dismiss, Esc to close and focus
 * handling come from the browser; shown as a sheet near the bottom so it never runs off a phone screen.
 */
export function GlossaryTip({ term }: { term: GlossaryTerm }) {
  const { t } = useTranslation();
  const id = 'gloss-' + useId().replace(/:/g, '');
  const title = t(`glossary.${term}.term`);
  return (
    <>
      <button type="button" className="glossary-btn" popoverTarget={id} aria-label={t('glossary.what', { term: title })} title={t('glossary.what', { term: title })}>
        <Info size={20} weight="bold" aria-hidden />
      </button>
      <span id={id} popover="auto" className="glossary-pop" role="dialog" aria-label={title}>
        <span className="glossary-term">{title}</span>
        <span className="glossary-plain">{t(`glossary.${term}.plain`)}</span>
        <button type="button" className="btn btn-secondary btn-small" popoverTarget={id} popoverTargetAction="hide">
          <X size={16} aria-hidden /> {t('glossary.close')}
        </button>
      </span>
    </>
  );
}
