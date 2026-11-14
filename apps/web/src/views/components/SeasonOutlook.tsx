/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Leaf, ClockCounterClockwise } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { OUTLOOK_DAYS, useSeasonOutlook } from '@/controllers/useSeasonOutlook';
import type { WindowDays } from '@/controllers/useSeasonVsNormal';
import { ConfidenceMeter } from './ConfidenceMeter';
import { SourceTag } from './SourceTag';

/** Season Twins + Confidence Meter + Track Record. */
export function SeasonOutlook({ days }: { days: WindowDays }) {
  const { t } = useTranslation();
  const o = useSeasonOutlook(days);
  if (!o) return null;
  const prov = { ...o.provenance, dateFrom: '2001-01-01' };
  return (
    <section className="card light outlook" aria-labelledby="twins-h">
      <h2 id="twins-h">{t('outlook.title')}</h2>
      <p className="small">{t('outlook.intro', { days: OUTLOOK_DAYS })}</p>
      <ul className="twin-years">
        {o.twins.twins.map((tw) => (
          <li key={tw.year}>
            <strong>{tw.year}</strong> <span className="small">{t('outlook.similarity', { d: tw.distance.toFixed(2) })}</span>
          </li>
        ))}
      </ul>

      {o.outlooks.map(({ key, outlook, track, confidence }) => {
        const unit = t('outlook.unit.' + key);
        const fmt = (x: number) => (key === 'greenness' ? x.toFixed(2) : `${x.toFixed(key === 'tmaxMean' ? 1 : 0)} ${unit}`);
        return (
          <div key={key} className="outlook-item">
            <h3>{t('outlook.outcome.' + key, { days: OUTLOOK_DAYS })}</h3>
            {!outlook.informative ? (
              <p className="small">{t('outlook.notInformative')}</p>
            ) : (
              <>
                <p className="outlook-dir">{t('outlook.direction.' + outlook.direction, { what: t('outlook.what.' + key) })}</p>
                <p className="small">
                  {t('outlook.values', { values: outlook.values.map((v) => `${v.year}: ${fmt(v.value)}`).join(', '), normal: fmt(outlook.normal) })}
                </p>
                {confidence && <ConfidenceMeter confidence={confidence} />}
                {track.n > 0 && (
                  <p className="small track">
                    <ClockCounterClockwise size={16} aria-hidden />{' '}
                    {t('outlook.track', { n: track.n, hits: track.hits, rate: Math.round(track.hitRate * 100), base: Math.round(track.baselineRate * 100) })}
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
      {!o.greenProvenance && <p className="small"><Leaf size={16} aria-hidden /> {t('outlook.greenNote')}</p>}
      <SourceTag provenance={prov} />
      {o.greenProvenance && <SourceTag provenance={o.greenProvenance} />}
    </section>
  );
}
