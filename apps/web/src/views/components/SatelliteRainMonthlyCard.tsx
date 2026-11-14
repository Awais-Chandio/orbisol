/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useTranslation } from 'react-i18next';
import { useSatelliteRainMonthly } from '@/controllers/useSatellitePoint';
import { monthName } from '@/views/format';
import { IndicatorCard } from './IndicatorCard';
import { CaseStudyBadge } from './CaseStudy';

const label = (ym: string) => `${monthName(Number(ym.slice(5, 7)), 'long')} ${ym.slice(0, 4)}`;

/**
 * "Satellite rain vs normal" from NASA GPM IMERG monthly. The WMO 1991-2020 normal is not available for IMERG, so the
 * reference is the IMERG record itself (from 2000); the months shown are the latest the monthly product has.
 */
export function SatelliteRainMonthlyCard() {
  const { t } = useTranslation();
  const { data, comparison: c } = useSatelliteRainMonthly();
  if (!data || !c) return null;
  const first = c.months[0]!;
  const last = c.months[c.months.length - 1]!;
  const y0 = c.years[0];
  const y1 = c.years[c.years.length - 1];
  const lastDay = new Date(Date.UTC(Number(last.slice(0, 4)), Number(last.slice(5, 7)), 0)).toISOString().slice(0, 10);
  const prov = { ...data.provenance, dateFrom: `${first}-01`, date: lastDay };
  return (
    <IndicatorCard
      titleKey="season.imergM.title"
      nowLabel={t('season.imergM.now')}
      v={{
        key: 'rainTotal',
        available: Number.isFinite(c.comparison.current) && c.comparison.nYears > 0,
        value: c.comparison.current,
        normal: c.comparison.normal,
        p10: c.comparison.p10,
        p90: c.comparison.p90,
        tercile: c.comparison.tercile,
        nYears: c.comparison.nYears,
        provenance: prov,
      }}
      explain={<p className="small">{t('season.imergM.method')}</p>}
    >
      <CaseStudyBadge />
      <p className="small gap-note">{t('season.imergM.window', { from: label(first), to: label(last) })}</p>
      <p className="small">{t('season.imergM.reference', { from: y0, to: y1, n: c.years.length })}</p>
    </IndicatorCard>
  );
}
