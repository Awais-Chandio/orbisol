/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Mountains, Wind } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useTerrain } from '@/controllers/useSatellitePoint';
import { monthName } from '@/views/format';
import { SourceTag } from './SourceTag';
import { CaseStudyBadge } from './CaseStudy';

/** Erosion picture: SRTM slope (water erosion) + windiest months and bare days (wind erosion). */
export function TerrainCard() {
  const { t } = useTranslation();
  const tr = useTerrain();
  if (!tr.slope) return null;
  const s = tr.slope;
  const flat = s.slopePct.primary < 2;
  const climate = tr.climate ? { ...tr.climate, dateFrom: '1991-01-01', date: '2020-12-31' } : null;
  return (
    <section className="card light">
      <h2><Mountains size={24} aria-hidden /> {t('terrain.title')}</h2>
      <CaseStudyBadge />
      <p className="indicator-value">{s.slopePct.primary.toFixed(2)}%</p>
      <p>{t('terrain.slope', { name: s.faoClass.name, code: s.faoClass.code })}</p>
      <p className="small">{t(flat ? 'terrain.waterLow' : 'terrain.waterHigher')}</p>
      <p className="small">{t('terrain.noise')}</p>
      <SourceTag provenance={s.provenance} />
      {tr.windy.length > 0 && (
        <>
          <h3><Wind size={24} aria-hidden /> {t('terrain.windTitle')}</h3>
          <p>{t('terrain.windy', { months: tr.windy.map((m) => monthName(m, 'long')).join(', ') })}</p>
          {tr.bareWindyDays > 0 && <p className="warn-line">{t('terrain.bareWindy', { days: tr.bareWindyDays })}</p>}
          {climate && <SourceTag provenance={climate} />}
        </>
      )}
    </section>
  );
}
