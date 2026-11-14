/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { WifiSlash } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '@/controllers/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useTranslation();
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      <WifiSlash size={16} aria-hidden />
      <span>{t('notice.offline')}</span>
    </div>
  );
}
