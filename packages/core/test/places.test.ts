import { describe, expect, it } from 'vitest';
import { compactPlace, normalizePlace, planShards, searchPlaceRows, type PlaceRow } from '../src';

describe('places/normalize', () => {
  it('lowercases, strips accents and punctuation (same as the Python pipeline)', () => {
    expect(normalizePlace('Sāhīwāl')).toBe('sahiwal');
    expect(normalizePlace("  Dera Ismail-Khan ")).toBe('dera ismail khan');
    expect(compactPlace('Tando Jam')).toBe('tandojam');
  });
});

describe('places/planShards', () => {
  const keys = ['hy', 'ta', 'goth~', 'gotha', 'gothb', 'go', 'lo'].filter((k) => k !== 'go');
  it('picks the longest leaf that prefixes the query', () => {
    expect(planShards('Hyderabad', keys)).toEqual({ keys: ['hy'], needMore: false });
    expect(planShards('Goth Ali', keys)).toEqual({ keys: ['gotha'], needMore: false });
  });
  it('loads exact-name shard and asks for more letters when the prefix is split', () => {
    expect(planShards('goth', keys)).toEqual({ keys: ['goth~'], needMore: true });
    expect(planShards('g', keys)).toEqual({ keys: [], needMore: true });
  });
});

describe('places/searchPlaceRows', () => {
  const rows: PlaceRow[] = [
    ['Hyderabad', 'Telangana', 'IN', 17.38, 78.46, 6_809_970],
    ['Hyderabad', 'Sindh', 'PK', 25.392, 68.3737, 1_386_330],
    ['Hyderabad Thar', 'Sindh', 'PK', 25.1, 69.1, 0],
    ['Tando Jam', 'Sindh', 'PK', 25.4281, 68.5292, 71_760],
    ['Tandojam Colony', 'Sindh', 'PK', 25.43, 68.53, 0],
    ['Hyderabad', 'Sindh', 'PK', 25.3921, 68.3738, 0], // near-duplicate
  ];

  it('ranks exact names first, then by population, and drops duplicates', () => {
    const r = searchPlaceRows(rows, 'hyderabad');
    expect(r.map((p) => `${p.name}/${p.country}`)).toEqual(['Hyderabad/IN', 'Hyderabad/PK', 'Hyderabad Thar/PK']);
  });

  it('prefers places near the current pin within the same rank', () => {
    const r = searchPlaceRows(rows, 'hyderabad', 8, { lat: 25.4, lon: 68.37 });
    expect(r.map((p) => `${p.name}/${p.country}`)).toEqual(['Hyderabad/PK', 'Hyderabad/IN', 'Hyderabad Thar/PK']);
    expect(r[0]!.distanceKm).toBeLessThan(2);
  });

  it('drops same-name entries within 10 km but keeps distant namesakes', () => {
    const more: PlaceRow[] = [...rows, ['Hyderabad', 'Sindh', 'PK', 25.45, 68.4, 0], ['Hyderabad', 'Sindh', 'PK', 27.0, 68.0, 0]];
    const r = searchPlaceRows(more, 'hyderabad', 8).filter((p) => p.country === 'PK' && p.name === 'Hyderabad');
    expect(r).toHaveLength(2);
  });

  it('matches with or without spaces', () => {
    expect(searchPlaceRows(rows, 'tandojam').map((p) => p.name)).toEqual(['Tando Jam', 'Tandojam Colony']);
    expect(searchPlaceRows(rows, 'Tando J')[0]!.name).toBe('Tando Jam');
  });

  it('needs at least two characters', () => {
    expect(searchPlaceRows(rows, 'h')).toEqual([]);
  });
});
