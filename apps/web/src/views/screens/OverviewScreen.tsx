/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import type { ReactNode } from 'react';
import { ArrowRight, CloudSun, Drop, Handshake, Sun, ThermometerHot, type Icon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHeat2050State } from '@/controllers/useHeat2050';
import { useRotationComparison } from '@/controllers/useRotationComparison';
import { OUTLOOK_DAYS, useSeasonOutlook } from '@/controllers/useSeasonOutlook';
import { useSeasonVsNormal } from '@/controllers/useSeasonVsNormal';
import { ConfidenceMeter } from '@/views/components/ConfidenceMeter';
import { NeedPin } from '@/views/components/NeedPin';
import { monthName } from '@/views/format';

const SEASON_DAYS = 90;
const round = (x: number) => String(Math.round(x));
const span = (v: [number, number]) => (round(v[0]) === round(v[1]) ? round(v[0]) : `${round(v[0])}–${round(v[1])}`);

function InsightCard({ to, icon: I, label, value, children }: { to: string; icon: Icon; label: string; value: ReactNode; children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className="card light insight-card">
      <span className="insight-label">
        <I size={24} aria-hidden /> {label}
      </span>
      <span className="insight-value">{value}</span>
      {children && <span className="insight-text">{children}</span>}
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

  // Season headline from the two indicators farmers ask about first.
  const ind = (k: 'hotDays' | 'rainTotal') => s.indicators.find((v) => v.key === k)?.tercile ?? 'none';
  const seasonLine = s.comparison
    ? t('overview.season.headline', { hot: t('overview.season.hot.' + ind('hotDays')), rain: t('overview.season.rain.' + ind('rainTotal')) })
    : null;

  // Twins outlook with a confidence level: greenness first when the satellite file is there.
  const tw = o?.outlooks.find((x) => x.confidence);

  const h245 = heat?.range.ssp245.change ?? null;
  const h585 = heat?.range.ssp585?.change ?? null;

  return (
    <section className="screen">
      <h1>{t('overview.title')}</h1>
      <p className="lead">{t('overview.intro')}</p>
      {r.pin.label && <p className="small">{r.pin.label}</p>}

      <div className="insight-grid">
        <InsightCard
          to="/calendar"
          icon={Sun}
          label={t('overview.bare.label')}
          value={ex ? t('overview.bare.value', { count: ex.metrics.bareHotDays }) : '…'}
        >
          {ex
            ? ex.metrics.bareHotDays > 0
              ? t('overview.bare.text', { months: hotMonths, total: ex.metrics.bareDays })
              : t('overview.bare.covered', { months: hotMonths })
            : loading}
        </InsightCard>

        <InsightCard
          to="/rotations"
          icon={Drop}
          label={t('overview.best.label')}
          value={
            best
              ? best.waterPct <= -3
                ? t('rotations.lessWater', { pct: -best.waterPct })
                : best.waterPct >= 3
                  ? t('rotations.moreWater', { pct: best.waterPct })
                  : t('rotations.sameWater')
              : '…'
          }
        >
          {best && ex ? (
            <>
              {t('overview.best.text', { crops: best.plan.slots.map((x) => t('crops.' + x.crop)).join(' → ') })}
              {ex.rank === 1 && <> {t('overview.best.existingFirst')}</>}
            </>
          ) : (
            loading
          )}
        </InsightCard>

        <InsightCard to="/season" icon={CloudSun} label={t('overview.season.label', { days: SEASON_DAYS })} value={seasonLine ?? '…'}>
          {s.comparison ? t('overview.season.text', { bFrom: s.comparison.baseline.from, bTo: s.comparison.baseline.to }) : s.isError ? t('season.error') : loading}
        </InsightCard>

        <InsightCard
          to="/season#heat-2050"
          icon={ThermometerHot}
          label={heat ? t('overview.heat.label', { from: heat.future.from, to: heat.future.to }) : t('overview.heat.labelPlain')}
          value={h245 ? t('overview.heat.value', { v: span(h245) }) : heatLoading ? '…' : '–'}
        >
          {heat && h245 ? (
            <>
              {t('overview.heat.text')}
              {h585 && <> {t('overview.heat.high', { v: span(h585) })}</>}
            </>
          ) : heatLoading ? (
            loading
          ) : (
            t('overview.heat.none')
          )}
        </InsightCard>
      </div>

      {tw && tw.confidence && (
        <Link to="/season#twins-h" className="card light insight-card confidence-card">
          <span className="insight-label">{t('overview.twins.label', { days: OUTLOOK_DAYS })}</span>
          <span className="insight-text">
            <strong>{t('outlook.outcome.' + tw.key, { days: OUTLOOK_DAYS })}:</strong> {t('outlook.direction.' + tw.outlook.direction)}
          </span>
          <ConfidenceMeter confidence={tw.confidence} factors={false} />
          <span className="insight-more">
            {t('overview.twins.why')} <ArrowRight size={16} aria-hidden />
          </span>
        </Link>
      )}

      <p className="overview-judgment">
        <Handshake size={24} aria-hidden /> {t('overview.judgment')}
      </p>
    </section>
  );
}
