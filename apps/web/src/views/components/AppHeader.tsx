/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useEffect, useId, useRef, useState } from 'react';
import { Info, NavigationArrow, Question } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTour } from '@/views/tour/Tour';

export function AppHeader() {
  const { t } = useTranslation();
  const { start } = useTour();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  // Close on outside click or Esc (focus back on the button).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="app-header">
      <Link to="/" className="brand" aria-label={t('app.name')}>
        <img src="/favicon.svg" alt="" width={28} height={28} />
        <span className="brand-name">{t('app.name')}</span>
      </Link>
      <div className="info-menu" ref={wrap}>
        <button
          ref={btn}
          type="button"
          className="icon-btn"
          aria-label={t('nav.info')}
          title={t('nav.info')}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
        >
          <Info size={24} />
        </button>
        {open && (
          <ul id={menuId} className="info-menu-list">
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  btn.current?.focus();
                  start();
                }}
              >
                <NavigationArrow size={20} aria-hidden /> {t('tour.start')}
              </button>
            </li>
            <li>
              <Link to="/about" onClick={() => setOpen(false)}>
                <Question size={20} aria-hidden /> {t('nav.about')}
              </Link>
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}
