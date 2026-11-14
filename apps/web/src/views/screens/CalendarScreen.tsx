/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { CloudRain, Plant, Snowflake, ThermometerHot, Warning, type Icon } from '@phosphor-icons/react';
import { doyToMd } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import { useGreennessMonthly } from '@/controllers/useGreenness';
import { useRotationComparison } from '@/controllers/useRotationComparison';
import { CropYearTimeline } from '@/views/components/CropYearTimeline';
import { JudgmentFlag } from '@/views/components/JudgmentFlag';
import { NeedPin } from '@/views/components/NeedPin';
import { SourceTag } from '@/views/components/SourceTag';
import { TerrainCard } from '@/views/components/TerrainCard';
import { formatMonthDay, monthName } from '@/views/format';

const HZ: Record<'hot' | 'frost' | 'heavyRain', Icon> = { hot: ThermometerHot, frost: Snowflake, heavyRain: CloudRain };

export function CalendarScreen() {
  const { t } = useTranslation();
  const r = useRotationComparison();
  const g = useGreennessMonthly();
  if (!r.pin)
    return (
      <section className="screen">
        <h1>{t('calendar.title')}</h1>
        <NeedPin />
      </section>
    );
  const ex = r.strategies[0];
  const farmerProv = { source: t('sources.farmer'), kind: 'farmer' as const, date: new Date().toISOString().slice(0, 10) };
  const climateProv = r.provenance ? { ...r.provenance, dateFrom: '1991-01-01', date: '2020-12-31' } : null;

  return (
    <section className="screen">
      <h1>{t('calendar.title')}</h1>
      <p className="lead">{t('calendar.intro')}</p>
      {r.isLoading && <p className="card light" role="status">{t('rotations.loading')}</p>}
      {ex && (
        <>
          <div className="calendar-top">
          <div className="card light">
            <h2>{ex.plan.slots.map((s) => t('crops.' + s.crop)).join(' → ')}</h2>
            {ex.metrics.bare.map((b) => (
              <p key={b.start} className="bare-span">
                <strong>{t('calendar.bareSpan', { from: formatMonthDay(doyToMd(b.start)), to: formatMonthDay(doyToMd(b.end)), days: b.days })}</strong>
              </p>
            ))}
            {ex.metrics.bareHotDays > 0 && (
              <p className="warn-line">
                <Warning size={24} aria-hidden />
                {t('calendar.bareHot', { days: ex.metrics.bareHotDays })}
              </p>
            )}
            <p><SourceTag provenance={farmerProv} /></p>
          </div>

          <div className="card light">
            <h2>{t('timeline.title')}</h2>
            <CropYearTimeline slots={ex.plan.slots} bare={ex.metrics.bare} hazards={r.hazards} ndvi={g.monthly} ndviProvenance={g.provenance} ndviGap={!g.isLoading} />
          </div>
          </div>

          <details className="disclosure month-details">
          <summary>{t('calendar.monthDetails')}</summary>
          <ol className="month-list">
            {r.calendar.map((m) => (
              <li key={m.month} className={'month-row' + (m.bareDays >= 15 ? ' is-bare' : '')}>
                <span className="month-name">{monthName(m.month, 'long')}</span>
                <div className="month-body">
                  {m.crops.length > 0 ? (
                    m.crops.map((c) => (
                      <p key={c.crop} className="month-crop">
                        <Plant size={16} aria-hidden /> <strong>{t('crops.' + c.crop)}</strong>: {t('stages.' + c.stage)}
                      </p>
                    ))
                  ) : null}
                  {m.bareDays > 0 && <p className="month-bare">{t('calendar.bareMonth', { days: m.bareDays })}</p>}
                  {m.hazards.length > 0 && (
                    <p className="month-hz">
                      {m.hazards.map((h) => {
                        const I = HZ[h];
                        return (
                          <span key={h} className="hz-chip">
                            <I size={16} aria-hidden /> {t('hazards.' + h)}
                          </span>
                        );
                      })}
                    </p>
                  )}
                  {m.vulnerable.map((v) => (
                    <p key={v.crop + v.hazard} className="warn-line">
                      <Warning size={16} aria-hidden />
                      {t('calendar.sensitive', { crop: t('crops.' + v.crop), hazard: t('hazards.' + v.hazard).toLowerCase() })}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          </details>
          <p className="small">{t('calendar.climateSource')} {climateProv && <SourceTag provenance={climateProv} />}</p>
          {r.hazards && r.hazards.frost.length === 0 && (
            <p className="small">{t(r.hazards.heavyRain.length === 0 ? 'calendar.noHazards' : 'calendar.noFrost')}</p>
          )}
          <p className="small"><JudgmentFlag reason={t('calendar.judgment')} /></p>
          <TerrainCard />
        </>
      )}
    </section>
  );
}
