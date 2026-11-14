/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { BookOpen, Cpu, Planet, Thermometer, User, type Icon } from '@phosphor-icons/react';
import type { ObservationKind, Provenance } from '@orbisol/core';
import { useTranslation } from 'react-i18next';

const KIND: Record<ObservationKind, { icon: Icon; labelKey: string }> = {
  satellite: { icon: Planet, labelKey: 'about.satellite' },
  model: { icon: Cpu, labelKey: 'about.model' },
  reanalysis: { icon: Cpu, labelKey: 'about.model' },
  ground: { icon: Thermometer, labelKey: 'about.ground' },
  farmer: { icon: User, labelKey: 'about.farmer' },
  reference: { icon: BookOpen, labelKey: 'about.reference' },
};

/** Data credit shown beside every number. Satellite vs model vs ground differ by icon, label and border. */
export function SourceTag({ provenance }: { provenance: Provenance }) {
  const { t } = useTranslation();
  const k = KIND[provenance.kind];
  const I = k.icon;
  const when = provenance.dateFrom ? provenance.dateFrom + ' to ' + provenance.date : provenance.date;
  return (
    <span className={'source-tag source-' + provenance.kind} title={t(k.labelKey)}>
      <I size={16} aria-hidden />
      <span className="sr-only">{t(k.labelKey)}: </span>
      {provenance.url ? (
        <a href={provenance.url} target="_blank" rel="noreferrer">{provenance.source}</a>
      ) : (
        provenance.source
      )}
      <span aria-hidden> · </span>
      <time dateTime={provenance.date}>{when}</time>
    </span>
  );
}
