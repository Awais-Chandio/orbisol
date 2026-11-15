/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import type { ReactNode } from 'react';
import { ArrowRight, CloudSun, Drop, Handshake, Printer, Sun, ThermometerHot, Warning, type Icon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { ClimateStripes } from '@/views/components/ClimateStripes';
import { CountUp } from '@/views/components/CountUp';
import { ListenButton } from '@/views/components/ListenButton';
import { useGreennessMonthly } from '@/controllers/useGreenness';
import { useHeat2050State } from '@/controllers/useHeat2050';
import { useRotationComparison } from '@/controllers/useRotationComparison';
import { inCaseStudy } from '@/config/caseStudy';
import { CaseStudyBadge, CaseStudyNote } from '@/views/components/CaseStudy';
import { OUTLOOK_DAYS, useSeasonOutlook } from '@/controllers/useSeasonOutlook';
import { useSeasonVsNormal } from '@/controllers/useSeasonVsNormal';
import { ConfidenceMeter } from '@/views/components/ConfidenceMeter';
import { TimelineSwitcher } from '@/views/components/TimelineSwitcher';
import { NeedPin } from '@/views/components/NeedPin';
import { PlainLine, Science, ScienceToggle } from '@/views/components/Science';
import { saltOverview } from '@/views/components/SaltNote';
import { monthName } from '@/views/format';
import { barePlain, heatPlain, seasonPlain, span, waterPlain } from '@/views/plain';

const SEASON_DAYS = 90;

/**
 * Farmer layer: icon + one plain sentence, with the exact number beside it.
 * Science layer (under "Show the science"): how the number was worked out.
 */
function InsightCard({ to, icon: I, label, plain, exact, science, badge, tour }: { to: string; icon: Icon; label: string; plain: ReactNode; exact?: ReactNode; science?: ReactNode; badge?: ReactNode; tour?: string }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className="card light insight-card" data-tour={tour}>
      <span className="insight-label">{label}</span>
      {badge}
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
  const here = inCaseStudy(r.pin);

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

  // The four farmer-layer sentences, in card order (also read aloud by "Listen").
  const plainBare = ex ? barePlain(t, ex.metrics.bareHotDays) : null;
  const plainBest = best && ex ? (ex.rank === 1 ? t('plain.existingFirst') : waterPlain(t, best.waterPct, bestCrops)) : null;
  const plainSeason = s.comparison ? seasonPlain(t, hot?.tercile ?? null, rain?.tercile ?? null) : null;
  const plainHeat = here && heat && h245 ? heatPlain(t, heat) : null;
  const sentences = [plainBare, plainBest, plainSeason, plainHeat].filter((x): x is string => !!x);

  return (
    <section className="screen">
      <h1>{t('overview.title')}</h1>
      <ClimateStripes className="stripes-wide" />
      <p className="lead">{t('overview.intro')}</p>
      {r.pin.label && <p className="small">{r.pin.label}</p>}
      <div className="screen-tools">
        <ListenButton sentences={sentences} />
        <ScienceToggle />
        <Link to="/report" className="btn btn-secondary report-link"><Printer size={20} aria-hidden /> {t('report.button')}</Link>
      </div>

      <div className="insight-grid">
        <InsightCard
          to="/calendar"
          tour="overview-bare"
          icon={Sun}
          label={t('overview.bare.label')}
          plain={plainBare ?? loading}
          exact={ex && <Trans i18nKey="overview.bare.exact" count={ex.metrics.bareHotDays} values={{ months: hotMonths, total: ex.metrics.bareDays }} components={{ n: <CountUp /> }} />}
        />

        <InsightCard
          to="/rotations"
          icon={Drop}
          label={t('overview.best.label')}
          plain={plainBest ?? loading}
          exact={
            best && (
              <Trans
                i18nKey={best.waterPct <= -3 ? 'overview.best.exactLess' : best.waterPct >= 3 ? 'overview.best.exactMore' : 'overview.best.exactSame'}
                values={{ crops: bestCrops, pct: Math.abs(best.waterPct) }}
                components={{ n: <CountUp /> }}
              />
            )
          }
          science={t('overview.best.science')}
        />

        <InsightCard
          to="/season"
          icon={CloudSun}
          label={t('overview.season.label', { days: SEASON_DAYS })}
          plain={plainSeason ?? (s.isError ? t('season.error') : loading)}
          exact={
            s.comparison && (
              <Trans
                i18nKey="overview.season.exact"
                values={{ hot: fmt0(hot?.value), hotN: fmt0(hot?.normal), rain: fmt0(rain?.value), rainN: fmt0(rain?.normal) }}
                components={{ n: <CountUp /> }}
              />
            )
          }
          science={s.comparison && t('overview.season.text', { bFrom: s.comparison.baseline.from, bTo: s.comparison.baseline.to })}
        />

        {here && (
        <InsightCard
          to="/season#heat-2050"
          badge={<CaseStudyBadge />}
          icon={ThermometerHot}
          label={heat ? t('overview.heat.label', { from: heat.future.from, to: heat.future.to }) : t('overview.heat.labelPlain')}
          plain={plainHeat ?? (heatLoading ? loading : t('overview.heat.none'))}
          exact={
            h245 &&
            (Math.round(h245[0]) === Math.round(h245[1]) ? (
              <Trans i18nKey="overview.heat.valueOne" values={{ v: Math.round(h245[0]) }} components={{ n: <CountUp /> }} />
            ) : (
              <Trans i18nKey="overview.heat.valueRange" values={{ lo: Math.round(h245[0]), hi: Math.round(h245[1]) }} components={{ n: <CountUp /> }} />
            ))
          }
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
        )}
      </div>
      <CaseStudyNote />

      {r.farm.soil.salty === true && r.strategies.length > 0 && (
        <Link to="/rotations" className="salt-overview">
          <PlainLine icon={Warning}>{saltOverview(t, r.strategies.flatMap((x) => x.plan.slots.map((y) => y.crop)))}</PlainLine>
        </Link>
      )}

      <Science className="overview-lower">
        {ex && (
          <div className="card light overview-timeline">
            <h2>{t('timeline.title')}</h2>
            <TimelineSwitcher strategies={r.strategies} hazards={r.hazards} ndvi={g.monthly} ndviProvenance={g.provenance} ndviGap={!g.isLoading && inCaseStudy(r.pin)} />
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
