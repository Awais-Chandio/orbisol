/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import type { ReactNode } from 'react';
import { ArrowRight, CloudSun, Drop, Handshake, Sun, ThermometerHot, type Icon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGreennessMonthly } from '@/controllers/useGreenness';
import { useHeat2050State } from '@/controllers/useHeat2050';
import { useRotationComparison } from '@/controllers/useRotationComparison';
import { OUTLOOK_DAYS, useSeasonOutlook } from '@/controllers/useSeasonOutlook';
import { useSeasonVsNormal } from '@/controllers/useSeasonVsNormal';
import { ConfidenceMeter } from '@/views/components/ConfidenceMeter';
import { TimelineSwitcher } from '@/views/components/TimelineSwitcher';
import { NeedPin } from '@/views/components/NeedPin';
import { Science, ScienceToggle } from '@/views/components/Science';
import { monthName } from '@/views/format';
import { barePlain, heatPlain, seasonPlain, span, waterPlain } from '@/views/plain';

const SEASON_DAYS = 90;

/**
 * Farmer layer: icon + one plain sentence, with the exact number beside it.
 * Science layer (under "Show the science"): how the number was worked out.
 */
function InsightCard({ to, icon: I, label, plain, exact, science }: { to: string; icon: Icon; label: string; plain: ReactNode; exact?: ReactNode; science?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className="card light insight-card">
      <span className="insight-label">{label}</span>
      <span className="insight-plain">
        <I size={32} weight="duotone" aria-hidden />
        <span>{plain}</span>
      </span>
      {exact && <span className="insight-exact">{exact}</span>}
      {science && (
        <Science>
          <span className="insight-text small">{science}</span>
        </Science>
      )}
      <span className="insight-more">
        {t('overview.details')} <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}

/** "Your field at a glance": four plain-word insights, each linking to its detail screen. */
export function OverviewScreen() {
  const { t } = useTranslation();
  const r = useRotationComparison();
  const s = useSeasonVsNormal(SEASON_DAYS);
  const o = useSeasonOutlook(SEASON_DAYS);
  const { data: heat, isLoading: heatLoading } = useHeat2050State();
  const g = useGreennessMonthly();

  if (!r.pin)
    return (
      <section className="screen">
        <h1>{t('overview.title')}</h1>
        <NeedPin />
      </section>
    );

  const loading = t('overview.loading');
  const ex = r.strategies[0];
  const best = r.strategies[1];
  const hotMonths = (r.hazards?.hot ?? []).map((m) => monthName(m, 'long')).join(', ');
  const ind = (k: 'hotDays' | 'rainTotal') => s.indicators.find((v) => v.key === k);
  const hot = ind('hotDays');
  const rain = ind('rainTotal');
  const fmt0 = (x: number | undefined) => (x === undefined || !Number.isFinite(x) ? '–' : Math.abs(x) < 10 ? x.toFixed(1).replace(/\.0$/, '') : String(Math.round(x)));
  // Twins outlook with a confidence level: greenness first when the satellite file is there.
  const tw = o?.outlooks.find((x) => x.confidence);
  const h245 = heat?.range.ssp245.change ?? null;
  const h585 = heat?.range.ssp585?.change ?? null;
  const bestCrops = best ? best.plan.slots.map((x) => t('crops.' + x.crop)).join(' → ') : '';

  return (
    <section className="screen">
      <h1>{t('overview.title')}</h1>
      <p className="lead">{t('overview.intro')}</p>
      {r.pin.label && <p className="small">{r.pin.label}</p>}
      <div className="screen-tools">
        <ScienceToggle />
      </div>

      <div className="insight-grid">
        <InsightCard
          to="/calendar"
          icon={Sun}
          label={t('overview.bare.label')}
          plain={ex ? barePlain(t, ex.metrics.bareHotDays) : loading}
          exact={ex && t('overview.bare.exact', { count: ex.metrics.bareHotDays, months: hotMonths, total: ex.metrics.bareDays })}
        />

        <InsightCard
          to="/rotations"
          icon={Drop}
          label={t('overview.best.label')}
          plain={best && ex ? (ex.rank === 1 ? t('plain.existingFirst') : waterPlain(t, best.waterPct, bestCrops)) : loading}
          exact={
            best &&
            t('overview.best.exact', {
              crops: bestCrops,
              water: best.waterPct <= -3 ? t('rotations.lessWater', { pct: -best.waterPct }) : best.waterPct >= 3 ? t('rotations.moreWater', { pct: best.waterPct }) : t('rotations.sameWater'),
            })
          }
          science={t('overview.best.science')}
        />

        <InsightCard
          to="/season"
          icon={CloudSun}
          label={t('overview.season.label', { days: SEASON_DAYS })}
          plain={s.comparison ? seasonPlain(t, hot?.tercile ?? null, rain?.tercile ?? null) : s.isError ? t('season.error') : loading}
          exact={s.comparison && t('overview.season.exact', { hot: fmt0(hot?.value), hotN: fmt0(hot?.normal), rain: fmt0(rain?.value), rainN: fmt0(rain?.normal) })}
          science={s.comparison && t('overview.season.text', { bFrom: s.comparison.baseline.from, bTo: s.comparison.baseline.to })}
        />

        <InsightCard
          to="/season#heat-2050"
          icon={ThermometerHot}
          label={heat ? t('overview.heat.label', { from: heat.future.from, to: heat.future.to }) : t('overview.heat.labelPlain')}
          plain={heat && h245 ? heatPlain(t, heat) : heatLoading ? loading : t('overview.heat.none')}
          exact={h245 && t('overview.heat.value', { v: span(h245) })}
          science={
            heat &&
            h245 && (
              <>
                {t('overview.heat.text')}
                {h585 && <> {t('overview.heat.high', { v: span(h585) })}</>}
              </>
            )
          }
        />
      </div>

      <Science className="overview-lower">
        {ex && (
          <div className="card light overview-timeline">
            <h2>{t('timeline.title')}</h2>
            <TimelineSwitcher strategies={r.strategies} hazards={r.hazards} ndvi={g.monthly} ndviProvenance={g.provenance} ndviGap={!g.isLoading} />
            <Link to="/calendar" className="insight-more">
              {t('overview.calendarLink')} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        )}

        {tw && tw.confidence && (
          <Link to="/season#twins-h" className="card light insight-card confidence-card">
            <span className="insight-label">{t('overview.twins.label', { days: OUTLOOK_DAYS })}</span>
            <span className="insight-text">{t('outlook.direction.' + tw.outlook.direction, { what: t('outlook.what.' + tw.key) })}</span>
            <ConfidenceMeter confidence={tw.confidence} factors={false} />
            <span className="insight-more">
              {t('overview.twins.why')} <ArrowRight size={16} aria-hidden />
            </span>
          </Link>
        )}
      </Science>

      <p className="overview-judgment">
        <Handshake size={24} aria-hidden /> {t('overview.judgment')}
      </p>
    </section>
  );
}
