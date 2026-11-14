// Orbisol - copy precomputed data/ JSON into the web app's public folder (served at /data/...).
// AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'data');
const dest = join(root, 'apps/web/public/data');
if (existsSync(dest)) rmSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true, filter: (p) => !p.endsWith('.md') });
console.log('synced data/ -> apps/web/public/data');
