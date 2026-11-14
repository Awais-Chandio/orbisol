/**
 * Orbisol core - offline place search over a prefix-sharded gazetteer (GeoNames, CC BY 4.0).
 * Normalization must match pipeline/scripts/places.py.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */

/** [name, admin1, country code, lat, lon, population] */
export type PlaceRow = [string, string, string, number, number, number];

export interface Place {
  name: string;
  admin1: string;
  country: string;
  lat: number;
  lon: number;
  population: number;
  /** Distance from the `near` point, km (when given). */
  distanceKm?: number;
}

/** Lowercase, strip accents, keep a-z0-9 separated by single spaces. */
export function normalizePlace(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Normalized without spaces, so "Tando Jam" and "tandojam" match. */
export function compactPlace(s: string): string {
  return normalizePlace(s).replaceAll(' ', '');
}

export const MIN_QUERY_CHARS = 2;

export interface ShardPlan {
  /** Shard keys to load (a key ending in "~" holds names exactly equal to the key). */
  keys: string[];
  /** Query is too short to pick a small shard; ask for more letters. */
  needMore: boolean;
}

/** Choose shards for a query. Leaf keys (without "~") are prefix-free. */
export function planShards(query: string, shardKeys: readonly string[]): ShardPlan {
  const q = compactPlace(query);
  if (q.length < MIN_QUERY_CHARS) return { keys: [], needMore: true };
  const keys: string[] = [];
  let leaf: string | undefined;
  for (const k of shardKeys) {
    if (!k.endsWith('~') && q.startsWith(k) && (!leaf || k.length > leaf.length)) leaf = k;
  }
  if (leaf) keys.push(leaf);
  if (shardKeys.includes(q + '~')) keys.push(q + '~');
  return { keys, needMore: !leaf };
}

export function rowToPlace(r: PlaceRow): Place {
  return { name: r[0], admin1: r[1], country: r[2], lat: r[3], lon: r[4], population: r[5] };
}

/** Great-circle distance in km (haversine). */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const NEAR_KM = 500;
export const DUPLICATE_KM = 10;

/**
 * Rank: exact name > name starts with query (word-aware) > compact prefix; within a rank, places within
 * NEAR_KM of `near` (the current pin) come first, then larger population.
 * Duplicates (same name and admin1 within DUPLICATE_KM) are dropped, keeping the better-ranked one.
 */
export function searchPlaceRows(
  rows: readonly PlaceRow[],
  query: string,
  limit = 8,
  near?: { lat: number; lon: number },
): Place[] {
  const qn = normalizePlace(query);
  const qc = qn.replaceAll(' ', '');
  if (qc.length < MIN_QUERY_CHARS) return [];
  const scored: { p: PlaceRow; rank: number; far: number }[] = [];
  for (const p of rows) {
    const n = normalizePlace(p[0]);
    const c = n.replaceAll(' ', '');
    if (!c.startsWith(qc)) continue;
    const rank = c === qc ? 0 : n.startsWith(qn) ? 1 : 2;
    const far = near && distanceKm(near, { lat: p[3], lon: p[4] }) > NEAR_KM ? 1 : 0;
    scored.push({ p, rank, far });
  }
  scored.sort((a, b) => a.rank - b.rank || a.far - b.far || b.p[5] - a.p[5]);
  const out: Place[] = [];
  for (const { p } of scored) {
    const place = rowToPlace(p);
    const dup = out.some(
      (o) =>
        o.admin1 === place.admin1 &&
        o.country === place.country &&
        normalizePlace(o.name) === normalizePlace(place.name) &&
        distanceKm(o, place) <= DUPLICATE_KM,
    );
    if (dup) continue;
    if (near) place.distanceKm = distanceKm(near, place);
    out.push(place);
    if (out.length >= limit) break;
  }
  return out;
}
