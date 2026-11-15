/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useState } from 'react';
import { ArrowClockwise, CloudArrowDown, Database, HardDrives } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useSeasonVsNormal, type WindowDays } from '@/controllers/useSeasonVsNormal';
import { ErrorText } from '@/views/components/ErrorText';
import { IndicatorCard } from '@/views/components/IndicatorCard';
import { JudgmentFlag } from '@/views/components/JudgmentFlag';
import { NeedPin } from '@/views/components/NeedPin';
import { SeasonOutlook } from '@/views/components/SeasonOutlook';
import { GreennessCard } from '@/views/components/GreennessCard';
import { SatelliteRainCards } from '@/views/components/SatelliteRainCards';
import { SatelliteRainMonthlyCard } from '@/views/components/SatelliteRainMonthlyCard';
import { TrendCard } from '@/views/components/TrendCard';
import { Heat2050Card } from '@/views/components/Heat2050Card';
import { useHeat2050 } from '@/controllers/useHeat2050';
import { useObservedTrend } from '@/controllers/useObservedTrend';
import { useSeasonOutlook } from '@/controllers/useSeasonOutlook';
import { PlainLine, Science, ScienceToggle } from '@/views/components/Science';
import { CaseStudyNote } from '@/views/components/CaseStudy';
import { heatPlain, seasonPlain } from '@/views/plain';
import { ChartLineUp, ClockCounterClockwise, CloudSun, Drop, Leaf, Snowflake, ThermometerHot, type Icon } from '@phosphor-icons/react';
import { TerrainCard } from '@/views/components/TerrainCard';
import type { LinearTrend } from '@orbisol/core';

/** Season cards grouped by what they are about; each group has an icon, a heading and a colour accent (never colour alone). */
const GROUPS: { id: 'heat' | 'water' | 'soil' | 'frost'; icon: Icon; keys: readonly string[] }[] = [
  { id: 'heat', icon: ThermometerHot, keys: ['hotDays', 'tmaxMean'] },
  { id: 'water', icon: Drop, keys: ['rainTotal', 'heavyRainDays', 'waterBalance', 'et0Total'] },
  { id: 'soil', icon: Leaf, keys: ['soilWetness', 'greenness'] },
  { id: 'frost', icon: Snowflake, keys: ['frostDays'] },
];

const dir = (f: LinearTrend | null) => (!f || !f.clear ? 'unclear' : f.perDecade > 0 ? 'up' : 'down');

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function SeasonScreen() {
  const { t } = useTranslation();
  const [days, setDays] = useState<WindowDays>(90);
  const s = useSeasonVsNormal(days);
  const trend = useObservedTrend();
  const heat2050 = useHeat2050();
  const outlook = useSeasonOutlook(days);

  if (!s.pin) {
    return (
      <section className="screen">
        <h1>{t('screens.season.title')}</h1>
        <NeedPin />
      </section>
    );
  }

  const cmp = s.comparison;
  const OriginIcon = s.origin === 'live' ? CloudArrowDown : s.origin === 'cache' ? HardDrives : Database;

  return (
    <section className="screen">
      <h1>{t('screens.season.title')}</h1>
      {s.comparison ? (
        <PlainLine icon={CloudSun}>
          {seasonPlain(
            t,
            s.indicators.find((v) => v.key === 'hotDays')?.tercile ?? null,
            s.indicators.find((v) => v.key === 'rainTotal')?.tercile ?? null,
            days,
          )}
        </PlainLine>
      ) : (
        <p className="lead">{t('plain.seasonLead')}</p>
      )}
      <div className="screen-tools">
        <ScienceToggle />
      </div>
      <CaseStudyNote />

      <div className="segmented" role="group" aria-label={t('season.windowLabel')}>
        {([30, 90] as const).map((d) => (
          <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>
            {t(d === 30 ? 'season.last30' : 'season.last90')}
          </button>
        ))}
      </div>

      {s.isLoading && <p className="card light" role="status">{t('season.loading')}</p>}
      {s.isError && (
        <>
          <ErrorText>{t('season.error')}</ErrorText>
          <button className="btn btn-secondary" onClick={s.retry}>
            <ArrowClockwise size={24} aria-hidden /> {t('season.retry')}
          </button>
        </>
      )}

      {cmp && (
        <>
          <Science>
          <p className="lead">
            {t('season.window', {
              from: fmtDate(cmp.window.start),
              to: fmtDate(cmp.window.end),
              days: cmp.lengthDays,
              bFrom: cmp.baseline.from,
              bTo: cmp.baseline.to,
              n: cmp.baseline.years.length,
            })}
          </p>
          {s.origin && (
            <p className="origin-chip">
              <OriginIcon size={16} aria-hidden />
              {t('season.origin.' + s.origin, { when: s.fetchedAt ? fmtDate(s.fetchedAt.slice(0, 10)) : '' })}
            </p>
          )}
          </Science>

          <nav className="group-chips" aria-label={t('season.groups.jump')}>
            {GROUPS.map((g) => (
              <a key={g.id} href={'#grp-' + g.id} className={'group-chip cat-' + g.id}>
                <g.icon size={16} weight="duotone" aria-hidden />
                {t('season.groups.' + g.id)}
              </a>
            ))}
          </nav>

          {GROUPS.map((g) => {
            const cards = s.indicators.filter((v) => g.keys.includes(v.key));
            return (
              <section key={g.id} id={'grp-' + g.id} className={'season-group cat-' + g.id} aria-labelledby={'grp-h-' + g.id}>
                <h2 id={'grp-h-' + g.id} className="group-head">
                  <span className="cat-chip">
                    <g.icon size={20} weight="duotone" aria-hidden />
                  </span>
                  {t('season.groups.' + g.id)}
                </h2>
                <div className="indicator-list">
                  {cards.map((v) => (
                    <IndicatorCard
                      key={v.key}
                      v={v}
                      explain={
                        v.key === 'hotDays' && Number.isFinite(cmp.thresholds.hotTmaxC) ? (
                          <p className="small">
                            {t('season.hotThreshold', { t: cmp.thresholds.hotTmaxC.toFixed(1), bFrom: cmp.baseline.from, bTo: cmp.baseline.to })}
                          </p>
                        ) : undefined
                      }
                    >
                      {v.key === 'frostDays' && <p className="small"><JudgmentFlag reason={t('season.frostFlag')} /></p>}
                      {v.key === 'rainTotal' && <p className="small"><JudgmentFlag reason={t('season.rainFlag')} /></p>}
                    </IndicatorCard>
                  ))}
                  {g.id === 'heat' && (
                    <Science>
                      {trend.trend && <TrendCard tr={trend.trend} climate={trend.provenance} />}
                      {heat2050 && <Heat2050Card h={heat2050} />}
                    </Science>
                  )}
                  {g.id === 'water' && (
                    <>
                      <SatelliteRainCards days={days} />
                      <SatelliteRainMonthlyCard />
                    </>
                  )}
                  {g.id === 'soil' && (
                    <>
                      <GreennessCard days={days} />
                      <TerrainCard />
                    </>
                  )}
                </div>
              </section>
            );
          })}

          <article className="card light ahead-card">
            <h2>{t('plain.aheadTitle')}</h2>
            {(() => {
              const first = outlook?.outlooks.find((x) => x.outlook.informative);
              return first ? (
                <PlainLine icon={ClockCounterClockwise}>
                  {t('outlook.direction.' + first.outlook.direction, { what: t('outlook.what.' + first.key) })}.
                </PlainLine>
              ) : null;
            })()}
            {trend.trend && (
              <PlainLine icon={ChartLineUp}>
                {t('plain.trend', {
                  from: trend.trend.fromYear,
                  hot: t('plain.trendHot.' + dir(trend.trend.hotDays)),
                  nights: t('plain.trendNights.' + dir(trend.trend.warmNights)),
                })}
              </PlainLine>
            )}
            {heat2050 && heatPlain(t, heat2050) && <PlainLine icon={ThermometerHot}>{heatPlain(t, heat2050)}</PlainLine>}
          </article>

          <Science className="season-more">
          <SeasonOutlook days={days} />

          <details className="card how-sure">
            <summary>{t('season.howSure')}</summary>
            <p>{t('season.sure1')}</p>
            <p>{t('season.sure2', { n: cmp.baseline.years.length })}</p>
            <p>{t('season.sure3')}</p>
            <p>{t('season.sure4')}</p>
            <p>{t('season.coverage', { pct: Math.round(cmp.currentCoverage * 100) })}</p>
          </details>
          </Science>
        </>
      )}
    </section>
  );
}
