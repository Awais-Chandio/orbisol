/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import type { Note, Provenance } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import { noteProvenance } from '@/config/citations';
import { formatMonthDay, monthName } from '@/views/format';
import { SourceTag } from './SourceTag';

/** Renders engine notes (i18n key + params) with a source credit beside each one. */
export function NoteList({ notes, climate }: { notes: Note[]; climate?: Provenance }) {
  const { t } = useTranslation();
  if (notes.length === 0) return null;
  const labels = { computed: t('sources.computed'), farmer: t('sources.farmer') };
  return (
    <ul className="note-list">
      {notes.map((n, i) => {
        const p = n.params ?? {};
        const params: Record<string, string | number> = { ...p };
        if (typeof p.crop === 'string') params.crop = t('crops.' + p.crop);
        if (typeof p.priority === 'string') params.priority = t(`priorities.${p.priority}.name`);
        if (typeof p.months === 'string') params.months = p.months.split(',').map((m) => monthName(Number(m))).join(', ');
        if (typeof p.from === 'string') params.from = formatMonthDay(p.from);
        if (typeof p.to === 'string') params.to = formatMonthDay(p.to);
        const prov = noteProvenance(n.source, climate, labels);
        return (
          <li key={n.key + i}>
            <span>{t('notes.' + n.key, params)}</span>
            {prov && <SourceTag provenance={prov} />}
          </li>
        );
      })}
    </ul>
  );
}
