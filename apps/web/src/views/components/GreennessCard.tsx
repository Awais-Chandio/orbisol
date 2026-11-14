/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Leaf } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useGreenness } from '@/controllers/useGreenness';
import { GlossaryTip } from './GlossaryTip';
import { IndicatorCard } from './IndicatorCard';
import { CaseStudyBadge, useInCaseStudy } from './CaseStudy';
import { Science } from './Science';

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Greenness (NDVI) this window vs normal; satellite data, shown with a satellite source tag. */
export function GreennessCard({ days }: { days: number }) {
  const { t } = useTranslation();
  const g = useGreenness(days);
  const here = useInCaseStudy();
  if (!here) return null; // Hyderabad-only layer: the screen shows one case-study note instead
  if (!g.available || !g.comparison || !g.data) {
    return (
      <article className="card light indicator">
        <header className="indicator-head">
          <h3>
            {t('season.ind.greenness.name')} <GlossaryTip term="ndvi" />
          </h3>
          <Leaf size={24} aria-hidden />
        </header>
        <p className="small">{t('season.ind.greenness.what')}</p>
        <p className="gap-note">{g.isLoading ? '…' : t('season.green.gapOutside')}</p>
      </article>
    );
  }
  const c = g.comparison.comparison;
  return (
    <IndicatorCard
      v={{
        key: 'greenness',
        available: Number.isFinite(c.current) && c.nYears > 0,
        value: c.current,
        normal: c.normal,
        p10: c.p10,
        p90: c.p90,
        tercile: c.tercile,
        nYears: c.nYears,
        provenance: { ...g.data.series.provenance, dateFrom: g.comparison.window.start, date: g.comparison.window.end },
      }}
      explain={
        <>
          <p className="small">{t('season.green.scale')}</p>
          <p className="small">{t('season.green.method', { km: g.data.method.windowKm })}</p>
        </>
      }
    >
      <CaseStudyBadge />
      <Science>
        <p className="small">
          {t('season.green.window', { from: fmtDate(g.comparison.window.start), to: fmtDate(g.comparison.window.end), n: g.comparison.composites })}
        </p>
      </Science>
    </IndicatorCard>
  );
}
