/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Info, Translate } from '@phosphor-icons/react';
import { setLanguage } from '@/i18n';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AppHeader() {
  const { t, i18n } = useTranslation();
  return (
    <header className="app-header">
      <Link to="/" className="brand" aria-label={t('app.name')}>
        <img src="/favicon.svg" alt="" width={28} height={28} />
        <span className="brand-name">{t('app.name')}</span>
      </Link>
      <button
        type="button"
        className="lang-btn"
        lang={i18n.language === 'ur' ? 'en' : 'ur'}
        aria-label={t('lang.label')}
        onClick={() => setLanguage(i18n.language === 'ur' ? 'en' : 'ur')}
      >
        <Translate size={20} aria-hidden /> {t('lang.switchTo')}
      </button>
      <Link to="/about" className="icon-btn" aria-label={t('nav.about')} title={t('nav.about')}>
        <Info size={24} />
      </Link>
    </header>
  );
}
