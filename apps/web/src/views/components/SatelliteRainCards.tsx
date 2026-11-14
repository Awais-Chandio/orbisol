/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useTranslation } from 'react-i18next';
import { useSatelliteRain } from '@/controllers/useSatellitePoint';
import { IndicatorCard } from './IndicatorCard';

/** GPM IMERG rain next to the model rain, so satellite and model numbers are shown side by side but labelled apart. */
export function SatelliteRainCards({ days }: { days: number }) {
  const { t } = useTranslation();
  const r = useSatelliteRain(days);
  // No IMERG file for this pin (or not deployed): show nothing; model rain above still applies.
  if (!r.comparison || !r.provenance) return null;
  const c = r.comparison;
  const prov = { ...r.provenance, dateFrom: c.window.start, date: c.window.end };
  const note = <p className="small">{t('season.imerg.note', { from: c.baseline.from, to: c.baseline.to, n: c.baseline.years.length })}</p>;
  return (
    <>
      {(['rainTotal', 'heavyRainDays'] as const).map((k) => (
        <IndicatorCard
          key={k}
          titleKey={`season.imerg.${k}`}
          explain={note}
          v={{ key: k, available: Number.isFinite(c[k].current), value: c[k].current, normal: c[k].normal, p10: c[k].p10, p90: c[k].p90, tercile: c[k].tercile, nYears: c[k].nYears, provenance: prov }}
        />
      ))}
    </>
  );
}
