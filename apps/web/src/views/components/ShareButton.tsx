/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { WhatsappLogo } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StrategyView } from '@/controllers/useRotationComparison';
import { monthName } from '@/views/format';
import { useNoteText } from './NoteList';

/** App link without any path, query or pin: the field location never leaves the phone in a shared message. */
function appLink(): string {
  return window.location.origin + '/';
}

/** Short summary of the top-ranked rotation for WhatsApp. */
export function useShareText(strategies: StrategyView[]): string | null {
  const { t } = useTranslation();
  const noteText = useNoteText();
  const top = strategies.find((s) => s.rank === 1);
  if (!top) return null;
  const crops = top.plan.slots.map((x) => t('crops.' + x.crop)).join(' → ');
  const water =
    top.plan.kind === 'existing'
      ? t('share.waterExisting')
      : top.waterPct <= -3
        ? t('share.waterLess', { pct: -top.waterPct })
        : top.waterPct >= 3
          ? t('share.waterMore', { pct: top.waterPct })
          : t('share.waterSame');
  // main risk: canal turn too long first (farmer-specific), then the first engine risk that is not just "new crop"
  let risk: string | null = null;
  if (top.fit?.overMonths.length)
    risk = t('share.riskCanal', { days: top.fit.intervalDays, months: top.fit.overMonths.map((m) => monthName(m)).join(', ') });
  else {
    const r = top.risks.find((n) => n.key !== 'risk.newCrop') ?? top.risks[0];
    if (r) risk = noteText(r);
  }
  return [
    t('share.head'),
    t(top.plan.kind === 'existing' ? 'share.topExisting' : 'share.top', { crops }),
    water,
    risk ? t('share.risk', { risk }) : t('share.noRisk'),
    t('share.check'),
    t('share.link', { url: appLink() }),
  ].join('\n');
}

/** Web Share API (phone share sheet) with a wa.me fallback on desktop browsers. */
export function ShareButton({ strategies }: { strategies: StrategyView[] }) {
  const { t } = useTranslation();
  const text = useShareText(strategies);
  const [status, setStatus] = useState<string | null>(null);
  if (!text) return null;
  const share = async () => {
    setStatus(null);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Orbisol', text });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return; // farmer closed the share sheet
        // any other failure (not allowed, not supported for this data): fall back to WhatsApp link
      }
    }
    const w = window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    if (!w) setStatus(t('share.blocked'));
  };
  return (
    <div className="card share-card">
      <button type="button" className="btn btn-primary share-btn" onClick={() => void share()}>
        <WhatsappLogo size={24} aria-hidden /> {t('share.button')}
      </button>
      <p className="small">{t('share.hint')}</p>
      <details className="share-preview">
        <summary>{t('share.preview')}</summary>
        <pre>{text}</pre>
      </details>
      {status && <p className="small" role="status">{status}</p>}
    </div>
  );
}
