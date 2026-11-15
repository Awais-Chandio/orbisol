/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Atom, type Icon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/**
 * Two layers: every screen opens with plain sentences (farmer layer); charts, ranges, sources and method text sit
 * under "Show the science". One switch for the whole app, open by default on every screen size so the science is visible first.
 */
const ScienceCtx = createContext<{ open: boolean; toggle: () => void }>({ open: true, toggle: () => {} });

export function ScienceProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const value = useMemo(() => ({ open, toggle }), [open, toggle]);
  return <ScienceCtx.Provider value={value}>{children}</ScienceCtx.Provider>;
}

export const useScience = () => useContext(ScienceCtx);

/** Science layer: charts, ranges, sources, method. Rendered only while "Show the science" is on. */
export function Science({ children, className }: { children: ReactNode; className?: string }) {
  const { open } = useScience();
  return open ? <div className={'science' + (className ? ' ' + className : '')}>{children}</div> : null;
}

/** The "Show the science" switch at the top of a screen. */
export function ScienceToggle() {
  const { t } = useTranslation();
  const { open, toggle } = useScience();
  return (
    <button type="button" className="science-toggle" aria-expanded={open} onClick={toggle}>
      <Atom size={20} aria-hidden />
      {open ? t('science.hide') : t('science.show')}
      <span className="science-chevron" aria-hidden />
    </button>
  );
}

/** Farmer layer: one plain sentence with an icon. */
export function PlainLine({ icon: I, children, tone }: { icon: Icon; children: ReactNode; tone?: 'warn' }) {
  return (
    <p className={'plain-line' + (tone ? ' plain-' + tone : '')}>
      <I size={28} weight="duotone" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
