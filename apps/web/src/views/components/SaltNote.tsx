/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { CheckCircle, Question, Warning, type Icon } from '@phosphor-icons/react';
import { CROPS, type CropId } from '@orbisol/core';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { referenceProvenance } from '@/config/citations';
import { JudgmentFlag } from './JudgmentFlag';
import { SourceTag } from './SourceTag';

export type SaltClass = 'sensitive' | 'tolerant' | 'unknown';

/** FAO-56 Table 23 (from FAO-29) rating of a crop, read from the cited crop rules; no new calculation. */
export function saltOf(crop: CropId): { cls: SaltClass; rating?: string; ece?: number } {
  const s = CROPS[crop].salt?.value;
  if (!s) return { cls: 'unknown' };
  return { cls: s.rating === 'S' || s.rating === 'MS' ? 'sensitive' : 'tolerant', rating: s.rating, ece: s.thresholdECe };
}

function saltLine(t: TFunction, crop: CropId): { icon: Icon; text: string; cls: SaltClass } {
  const s = saltOf(crop);
  const name = t('crops.' + crop);
  if (s.cls === 'unknown') return { icon: Question, cls: s.cls, text: t('salt.unknown', { crop: name }) };
  const rating = t('saltRating.' + s.rating);
  const key = s.cls + (s.ece === undefined ? 'NoValue' : '');
  return { icon: s.cls === 'sensitive' ? Warning : CheckCircle, cls: s.cls, text: t('salt.' + key, { crop: name, rating, ece: s.ece }) };
}

/** Shown on each rotation card when the farmer says the soil is salty: every crop's salt tolerance in plain words. */
export function SaltNote({ crops }: { crops: CropId[] }) {
  const { t } = useTranslation();
  const lines = [...new Set(crops)].map((c) => saltLine(t, c));
  const anySensitive = lines.some((l) => l.cls === 'sensitive');
  return (
    <section className={'salt-note' + (anySensitive ? ' is-risk' : '')} aria-label={t('salt.title')}>
      <h3 className="small-head">{t('salt.title')}</h3>
      <ul>
        {lines.map((l) => (
          <li key={l.text} className={'salt-' + l.cls}>
            <l.icon size={20} weight="bold" aria-hidden />
            <span>{l.text}</span>
          </li>
        ))}
      </ul>
      <p className="small">{t('salt.ece')}</p>
      <p className="small">
        <JudgmentFlag reason={t('salt.test')} /> <SourceTag provenance={referenceProvenance('fao56_t23')} />
      </p>
    </section>
  );
}

/** One plain sentence for the Overview: which compared crops can lose yield to salt, which cope, which have no value. */
export function saltOverview(t: TFunction, crops: CropId[]): string {
  const uniq = [...new Set(crops)];
  const names = (cls: SaltClass) => uniq.filter((c) => saltOf(c).cls === cls).map((c) => t('crops.' + c)).join(', ');
  const [sens, tol, unk] = [names('sensitive'), names('tolerant'), names('unknown')];
  const parts = [
    sens && t('salt.overviewSens', { sensitive: sens }),
    tol && t(sens ? 'salt.overviewTol' : 'salt.overviewTolOnly', { tolerant: tol }),
    unk && t('salt.overviewUnknown', { unknown: unk }),
  ].filter(Boolean);
  return t('salt.overview', { parts: parts.join('; ') });
}
