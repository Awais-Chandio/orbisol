/**
 * Orbisol web - rotation comparison controller: farmer inputs + climate normals -> core compareRotations.
 * Re-ranks instantly when the farmer changes priorities.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useMemo } from 'react';
import { compareRotations, monthTimeline, PRIORITY_WEIGHTS, waterFit, type MonthCell, type Priority, type StrategyReport, type WaterFit } from '@orbisol/core';
import { useFarmStore } from '@/stores/farmStore';
import { useClimateEnvironment } from './useClimate';

export interface StrategyView extends StrategyReport {
  /** Relative water vs the existing rotation (+ = more water). 0 for the existing rotation. */
  waterPct: number;
  bareDelta: number;
  bareHotDelta: number;
  legumeDaysDelta: number;
  rank: number;
  months: MonthCell[];
  /** Canal turn vs safe interval per month (null when the farmer has not given a canal turn). */
  fit: WaterFit | null;
  /** The same Water Fit with another canal turn interval (what-if; never saved). Null when fit is null. */
  fitWith: ((intervalDays: number) => WaterFit) | null;
}

export function useRotationComparison() {
  const farm = useFarmStore((s) => s.farm);
  const update = useFarmStore((s) => s.update);
  const { pin, query, data, env } = useClimateEnvironment();

  const result = useMemo(() => {
    if (!env) return null;
    const reports = compareRotations(
      { existing: farm.rotation, priorities: farm.priorities, salty: farm.soil.salty },
      { et0Clim: env.et0Clim, hazards: env.hazards },
    );
    const base = reports[0]!;
    const alts = reports.slice(1).sort((a, b) => b.total - a.total);
    const views: StrategyView[] = [base, ...alts].map((r) => ({
      ...r,
      waterPct: Math.round((r.metrics.water.mm / base.metrics.water.mm - 1) * 100),
      bareDelta: r.metrics.bareDays - base.metrics.bareDays,
      bareHotDelta: r.metrics.bareHotDays - base.metrics.bareHotDays,
      legumeDaysDelta: Math.round((r.metrics.legumeShare - base.metrics.legumeShare) * 365),
      rank: 0,
      months: monthTimeline(r.plan, r.metrics, env.hazards),
      fit: farm.canal ? waterFit(r.plan, env.et0Clim, farm.canal.intervalDays, farm.soil.texture) : null,
      fitWith: farm.canal ? (d: number) => waterFit(r.plan, env.et0Clim, d, farm.soil.texture) : null,
    }));
    // rank by total score among all three (existing included), 1 = best fit for the chosen priorities
    [...views].sort((a, b) => b.total - a.total).forEach((v, i) => (v.rank = i + 1));
    return { strategies: views, calendar: views[0]!.months, hazards: env.hazards, monthly: env.monthly };
  }, [env, farm.rotation, farm.priorities, farm.soil.salty, farm.soil.texture, farm.canal]);

  const weights = farm.priorities.map((p, i) => ({ priority: p, weight: PRIORITY_WEIGHTS[i] ?? 1 }));
  const setPriorities = (priorities: Priority[]) => update({ priorities });

  return {
    pin,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: () => void query.refetch(),
    provenance: data?.series.provenance,
    farm,
    weights,
    setPriorities,
    strategies: result?.strategies ?? [],
    calendar: result?.calendar ?? [],
    hazards: result?.hazards,
    monthly: result?.monthly ?? [],
  };
}
