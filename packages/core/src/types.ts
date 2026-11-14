/**
 * Orbisol core - shared domain types.
 * AI-assisted: drafted with Claude (Anthropic); design decisions by the Orbisol team. See docs/ai-usage.md.
 */

/** How a value was observed. Satellite and ground/model data are shown differently in the UI. */
export type ObservationKind = 'satellite' | 'ground' | 'model' | 'reanalysis' | 'farmer' | 'reference';

/** Every number Orbisol shows carries where it came from and when. */
export interface Provenance {
  /** Short dataset name, e.g. "NASA POWER (daily, ag community)". */
  source: string;
  kind: ObservationKind;
  /** ISO date (YYYY-MM-DD) of the observation, or the end of the observed window. */
  date: string;
  /** Optional start of the observed window (ISO date). */
  dateFrom?: string;
  /** Optional link to the dataset or citation. */
  url?: string;
}

/** A number with its provenance and optional unit. */
export interface SourcedValue<T = number> {
  value: T;
  unit?: string;
  provenance: Provenance;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Confidence {
  level: ConfidenceLevel;
  /** Plain-language reason for the level. */
  reason: string;
}

export interface LatLon {
  lat: number;
  lon: number;
}

/** Month index 1-12. */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type SoilTexture = 'sandy' | 'loam' | 'clay';

/** The six farmer priorities named in the challenge statement. */
export type Priority =
  | 'water_use'
  | 'forage_value'
  | 'nitrogen_fixing'
  | 'erosion_reduction'
  | 'organic_matter'
  | 'market_suitability';

export const PRIORITIES: readonly Priority[] = [
  'water_use',
  'forage_value',
  'nitrogen_fixing',
  'erosion_reduction',
  'organic_matter',
  'market_suitability',
] as const;

/** Canal irrigation turn (warabandi). */
export interface CanalTurn {
  /** Days between two turns. */
  intervalDays: number;
  /** Hours of water per turn. */
  hours: number;
}
