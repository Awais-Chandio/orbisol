/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** The story order judges and farmers follow: pin, describe the farm, see the overview, then the details. */
export const STORY: { path: string; key: string }[] = [
  { path: '/field', key: 'nav.field' },
  { path: '/farm', key: 'nav.farm' },
  { path: '/overview', key: 'nav.overview' },
  { path: '/rotations', key: 'nav.rotations' },
  { path: '/calendar', key: 'nav.calendar' },
  { path: '/season', key: 'nav.season' },
];

/** "Next step ->" at the bottom of each story screen; the last one leads back to the overview. */
export function NextStep({ pathname }: { pathname: string }) {
  const { t } = useTranslation();
  const i = STORY.findIndex((s) => s.path === pathname);
  if (i < 0) return null;
  const next = STORY[i + 1];
  return (
    <nav className="next-step" aria-label={t('next.aria')}>
      {next ? (
        <Link to={next.path} className="btn btn-primary">
          {t('next.label', { screen: t(next.key) })} <ArrowRight size={24} aria-hidden />
        </Link>
      ) : (
        <Link to="/overview" className="btn btn-secondary">
          <ArrowLeft size={24} aria-hidden /> {t('next.back')}
        </Link>
      )}
    </nav>
  );
}
