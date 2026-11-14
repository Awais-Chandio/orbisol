/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Handshake } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/** Always-visible reminder that Orbisol supports, not replaces, farmer judgment. */
export function JudgmentNotice() {
  const { t } = useTranslation();
  return (
    <p className="judgment-notice" role="note">
      <Handshake size={16} aria-hidden />
      <span>{t('notice.judgment')}</span>
    </p>
  );
}
