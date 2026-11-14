/**
 * Orbisol web - offline place search: loads only the small index shards a query needs.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { planShards, searchPlaceRows, type Place, type PlaceRow, type Provenance } from '@orbisol/core';
import { PLACES } from '@/config/sources';
import { PlacesIndexSchema, PlacesShardSchema, type PlacesIndex } from '@/models/places';

let indexPromise: Promise<PlacesIndex> | null = null;
const shardCache = new Map<string, Promise<PlaceRow[]>>();

function loadIndex(): Promise<PlacesIndex> {
  indexPromise ??= fetch(PLACES.index)
    .then((r) => {
      if (!r.ok) throw new Error(`places index HTTP ${r.status}`);
      return r.json();
    })
    .then((j) => PlacesIndexSchema.parse(j))
    .catch((e) => {
      indexPromise = null; // allow retry
      throw e;
    });
  return indexPromise;
}

function loadShard(key: string): Promise<PlaceRow[]> {
  let p = shardCache.get(key);
  if (!p) {
    p = fetch(PLACES.shard(key))
      .then((r) => {
        if (!r.ok) throw new Error(`places shard HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => PlacesShardSchema.parse(j).rows as PlaceRow[])
      .catch((e) => {
        shardCache.delete(key);
        throw e;
      });
    shardCache.set(key, p);
  }
  return p;
}

export interface PlaceSearchResult {
  places: Place[];
  needMore: boolean;
  provenance: Provenance;
}

export async function searchPlaces(query: string, near?: { lat: number; lon: number }): Promise<PlaceSearchResult> {
  const index = await loadIndex();
  const plan = planShards(query, index.shards);
  const rows = (await Promise.all(plan.keys.map(loadShard))).flat();
  return { places: searchPlaceRows(rows, query, 8, near), needMore: plan.needMore, provenance: index.provenance };
}
