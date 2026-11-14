/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { MapPin } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NeedPin() {
  const { t } = useTranslation();
  return (
    <div className="card light">
      <p>{t('placeholder.needPin')}</p>
      <Link to="/" className="btn btn-primary">
        <MapPin size={24} aria-hidden /> {t('placeholder.goToField')}
      </Link>
    </div>
  );
}
