/**
 * Orbisol web - on-device cache (IndexedDB via Dexie) so data works offline on weak networks.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import Dexie, { type Table } from 'dexie';
import type { ClimateFile } from '@/models/climate';

export interface ClimateCacheRow {
  key: string;
  fetchedAt: number;
  file: ClimateFile;
}

class OrbisolDb extends Dexie {
  climate!: Table<ClimateCacheRow, string>;
  constructor() {
    super('orbisol');
    this.version(1).stores({ climate: 'key, fetchedAt' });
    // v2: file format orbisol.daily.v2 (raw vars for ET0); old rows fail Zod and are refetched.
    this.version(2).stores({ climate: 'key, fetchedAt' }).upgrade((tx) => tx.table('climate').clear());
  }
}

export const db = new OrbisolDb();
