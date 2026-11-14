/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { UsersThree } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/** Marks a spot where local human judgment matters most. */
export function JudgmentFlag({ reason }: { reason: string }) {
  const { t } = useTranslation();
  return (
    <span className="judgment-flag">
      <UsersThree size={16} aria-hidden />
      <strong>{t('notice.checkLocally')}:</strong> {reason}
    </span>
  );
}
