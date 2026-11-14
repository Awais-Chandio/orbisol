/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Bug, Coins, Drop, Question, type Icon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { StrategyView } from '@/controllers/useRotationComparison';
import { citedNotesFor, citedProvenance, type CitedTopic } from '@/config/citedNotes';
import { JudgmentFlag } from './JudgmentFlag';
import { SourceTag } from './SourceTag';

const ICON: Record<CitedTopic, Icon> = { pest: Bug, infiltration: Drop, income: Coins };

/** Pest cycles, water soaking in and fodder income: short notes, each with its source (or marked as a gap). */
export function CitedNotes({ s, current }: { s: StrategyView; current: StrategyView }) {
  const { t } = useTranslation();
  const notes = citedNotesFor(s, current);
  if (notes.length === 0) return null;
  return (
    <details className="note-section cited-notes">
      <summary>
        {t('cited.title')} ({notes.length})
      </summary>
      <ul className="note-list">
        {notes.map((n) => {
          const I = n.gap ? Question : ICON[n.topic];
          return (
            <li key={n.key}>
              <span className="cited-line">
                <I size={16} aria-hidden /> <span>{t('cited.' + n.key)}</span>
              </span>
              {n.check && <JudgmentFlag reason={t('cited.' + n.check)} />}
              {n.sources.map((id) => (
                <SourceTag key={id} provenance={citedProvenance(id)} />
              ))}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
