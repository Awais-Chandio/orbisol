/**
 * Orbisol web - short cited notes for Field Shift objectives the engine does not score: pest-cycle breaks,
 * water soaking in (infiltration) and supplemental income from fodder. Presentation only: which note shows depends on
 * the crops in a plan and its bare days vs the current rotation (no new calculation). Every note carries its source;
 * where no reliable source was found the note says so ("information gap"). Sources read on 2026-11-15.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { CROPS, type CropId, type Provenance } from '@orbisol/core';
import type { StrategyView } from '@/controllers/useRotationComparison';

export const CITED_SOURCES = {
  dawn_pbw_2013: {
    label: 'Dawn: Pink bollworm a threat to Sindh cotton',
    date: '2013-10-28',
    url: 'https://www.dawn.com/news/1052279',
  },
  ucipm_pbw: {
    label: 'UC IPM: Pink bollworm (cotton guidelines)',
    date: '2015-09',
    url: 'https://ipm.ucanr.edu/agriculture/cotton/pink-bollworm/',
  },
  saeed_whitefly: {
    label: 'Saeed et al.: B. tabaci host range, Multan (CottonGen poster)',
    date: 'n.d.',
    url: 'https://cottongen.org/node/1287558',
  },
  fao_sb80: {
    label: 'FAO Soils Bulletin 80, ch. 5 (Bot & Benites)',
    date: '2005',
    url: 'https://www.fao.org/4/a0100e/a0100e08.htm',
  },
  ary_fodder_2026: {
    label: 'ARY News: Karachi dairy sector and fodder supply',
    date: '2026-07-22',
    url: 'https://arynews.tv/milk-shortage-likely-in-karachi-22-july-2026',
  },
  dawn_fodder_2005: {
    label: 'Dawn: Reaping a rich harvest from maize crop',
    date: '2005-05-16',
    url: 'https://www.dawn.com/news/139366',
  },
} as const;
export type CitedSourceId = keyof typeof CITED_SOURCES;

export function citedProvenance(id: CitedSourceId): Provenance {
  const s = CITED_SOURCES[id];
  return { source: s.label, kind: 'reference', date: s.date, url: s.url };
}

export type CitedTopic = 'pest' | 'infiltration' | 'income';

export interface CitedNote {
  topic: CitedTopic;
  /** i18n key under "cited." */
  key: string;
  sources: CitedSourceId[];
  /** Reason shown as a "Check locally" flag. */
  check?: string;
  /** No reliable source found: shown as an information gap. */
  gap?: boolean;
}

const FODDER: CropId[] = ['berseem', 'sorghum_fodder'];
const has = (s: StrategyView, c: CropId) => s.plan.slots.some((x) => x.crop === c);
const isLegume = (c: CropId) => CROPS[c].family.value === 'Fabaceae';

/** Notes for one rotation card; `current` is the farmer's existing rotation. */
export function citedNotesFor(s: StrategyView, current: StrategyView): CitedNote[] {
  const out: CitedNote[] = [];
  const existing = s.plan.kind === 'existing';

  // Pest cycles
  if (has(s, 'cotton')) {
    out.push({ topic: 'pest', key: 'pest.cottonCarry', sources: ['dawn_pbw_2013', 'ucipm_pbw'] });
    out.push({ topic: 'pest', key: 'pest.whitefly', sources: ['saeed_whitefly'] });
  } else if (has(current, 'cotton')) {
    out.push({ topic: 'pest', key: 'pest.cottonBreak', sources: ['dawn_pbw_2013', 'ucipm_pbw'], check: 'pest.neighbours' });
  } else {
    out.push({ topic: 'pest', key: 'pest.gap', sources: [], gap: true });
  }

  // Infiltration: cover vs bare soil, from bare days already computed
  out.push({ topic: 'infiltration', key: !existing && s.bareDelta < 0 ? 'soak.moreCover' : 'soak.bare', sources: ['fao_sb80'] });
  if (s.plan.slots.some((x) => isLegume(x.crop))) out.push({ topic: 'infiltration', key: 'soak.legumeGap', sources: [], gap: true });

  // Supplemental income: fodder crops only
  if (s.plan.slots.some((x) => FODDER.includes(x.crop)))
    out.push({ topic: 'income', key: 'income.fodder', sources: ['ary_fodder_2026', 'dawn_fodder_2005'], check: 'income.prices' });

  return out;
}
