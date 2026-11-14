/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowsClockwise, CalendarDots, CloudSun, Farm, MapPin, type Icon } from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ITEMS: { to: string; key: string; icon: Icon }[] = [
  { to: '/', key: 'nav.field', icon: MapPin },
  { to: '/farm', key: 'nav.farm', icon: Farm },
  { to: '/season', key: 'nav.season', icon: CloudSun },
  { to: '/rotations', key: 'nav.rotations', icon: ArrowsClockwise },
  { to: '/calendar', key: 'nav.calendar', icon: CalendarDots },
];

export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ITEMS.map(({ to, key, icon: I }) => (
        <NavLink key={to} to={to} end={to === '/'} className="nav-item">
          {({ isActive }) => (
            <>
              <I size={24} weight={isActive ? 'bold' : 'regular'} aria-hidden />
              <span>{t(key)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
