/**
 * Orbisol web - short labels for cited sources so every rotation number shows its credit.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { SOURCES, type Note, type Provenance, type SourceId } from '@orbisol/core';

const SHORT: Record<SourceId, { label: string; date: string }> = {
  fao56_t11: { label: 'FAO-56 Table 11', date: '1998' },
  fao56_t12: { label: 'FAO-56 Table 12', date: '1998' },
  fao56_t19: { label: 'FAO-56 Table 19', date: '1998' },
  fao56_t22: { label: 'FAO-56 Table 22', date: '1998' },
  fao56_t23: { label: 'FAO-56 Table 23 (FAO-29)', date: '1998' },
  sindh_sowing: { label: 'Sindh Agriculture Dept', date: '2026-11-14' },
  feedipedia_berseem: { label: 'Feedipedia', date: '2016' },
  feedipedia_sorghum: { label: 'Feedipedia', date: '2015' },
  feedipedia_mung: { label: 'Feedipedia', date: '2015' },
  feedipedia_chickpea: { label: 'Feedipedia', date: '2015' },
  feedipedia_wheat: { label: 'Feedipedia', date: '2015' },
  feedipedia_rice_straw: { label: 'Feedipedia', date: '2015' },
  feedipedia_sugarcane: { label: 'Feedipedia', date: '2018' },
  feedipedia_cotton: { label: 'Feedipedia', date: '2019' },
  feedipedia_sunflower: { label: 'Feedipedia', date: '2015' },
  feedipedia_sunflower_residue: { label: 'Feedipedia', date: '2015' },
  feedipedia_mung_straw: { label: 'Feedipedia', date: '2015' },
  feedipedia_chickpea_straw: { label: 'Feedipedia', date: '2015' },
  dawn_mung_2007: { label: 'Dawn (newspaper)', date: '2007' },
};

export function noteProvenance(source: Note['source'], climate: Provenance | undefined, labels: { computed: string; farmer: string }): Provenance | null {
  if (!source) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (source === 'nasa_power') return climate ? { ...climate, dateFrom: '1991-01-01', date: '2020-12-31' } : null;
  if (source === 'computed') return { source: labels.computed, kind: 'model', date: today };
  if (source === 'farmer') return { source: labels.farmer, kind: 'farmer', date: today };
  const s = SHORT[source];
  return { source: s.label, kind: 'reference', date: s.date, url: SOURCES[source].url };
}

/** Provenance for a cited reference source (FAO-56 tables, Feedipedia, ...). */
export function referenceProvenance(source: SourceId): Provenance {
  const s = SHORT[source];
  return { source: s.label, kind: 'reference', date: s.date, url: SOURCES[source].url };
}
