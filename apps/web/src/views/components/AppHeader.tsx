/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Info } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AppHeader() {
  const { t } = useTranslation();
  return (
    <header className="app-header">
      <Link to="/" className="brand" aria-label={t('app.name')}>
        <img src="/favicon.svg" alt="" width={28} height={28} />
        <span className="brand-name">{t('app.name')}</span>
      </Link>
      <Link to="/about" className="icon-btn" aria-label={t('nav.about')} title={t('nav.about')}>
        <Info size={24} />
      </Link>
    </header>
  );
}
