/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Gauge } from '@phosphor-icons/react';
import type { ConfidenceResult } from '@orbisol/core';
import { useTranslation } from 'react-i18next';

const BARS = { high: 3, medium: 2, low: 1 } as const;

/** Confidence level shown as a word plus 1-3 filled bars (never colour alone). */
export function ConfidenceMeter({ confidence, factors = true }: { confidence: ConfidenceResult; factors?: boolean }) {
  const { t } = useTranslation();
  const on = BARS[confidence.level];
  return (
    <div className={'confidence confidence-' + confidence.level}>
      <p className="confidence-head">
        <Gauge size={24} aria-hidden />
        {t('outlook.confidence')}: <strong>{t('outlook.levels.' + confidence.level)}</strong>
        <span className="meter" aria-hidden>
          {[1, 2, 3].map((i) => (
            <span key={i} className={i <= on ? 'on' : ''} />
          ))}
        </span>
      </p>
      {factors && (
        <ul className="small factor-list">
          {confidence.factors.map((f) => (
            <li key={f.key}>{t(f.key, f.params ?? {})}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
