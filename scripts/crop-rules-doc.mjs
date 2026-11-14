// Orbisol - generate docs/crop-rules.md from packages/core/src/rotation/crops.ts (single source of truth).
// AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
import { writeFileSync } from 'node:fs';
import { CROPS } from '../packages/core/src/rotation/crops.ts';
import { SOURCES } from '../packages/core/src/rotation/sources.ts';

const used = new Set();
const ref = (c) => {
  if (!c) return '—';
  used.add(c.source);
  return `[${c.source}]${c.note ? ` (${c.note})` : ''}`;
};
const r = (a) => (a[0] === a[1] ? `${a[0]}` : `${a[0]}–${a[1]}`);
const rows = Object.values(CROPS).map((c) => {
  const k = c.kc.value;
  return [
    c.name,
    `${c.family.value} ${ref(c.family)}`,
    `${c.sowing.value.from} to ${c.sowing.value.to} ${ref(c.sowing)}`,
    c.harvest ? `${c.harvest.value.from} to ${c.harvest.value.to} ${ref(c.harvest)}` : c.seasonDays ? `${c.seasonDays.value} days ${ref(c.seasonDays)}` : '— (gap)',
    `${c.stages.value.join('/')} ${ref(c.stages)}`,
    `${k.ini} / ${r(k.mid)} / ${r(k.end)} ${ref(c.kc)}`,
    c.rootDepthM ? `${r(c.rootDepthM.value)} m ${ref(c.rootDepthM)}` : '— (gap)',
    c.salt ? `${c.salt.value.thresholdECe ?? '—'} dS/m, ${c.salt.value.rating} ${ref(c.salt)}` : '— (gap)',
    `${c.nitrogenFixing.value ? 'yes' : 'no'} ${ref(c.nitrogenFixing)}`,
    c.forage ? `${c.forage.value} ${ref(c.forage)}` : '— (gap)',
  ];
});
const head = ['Crop', 'Family', 'Sowing (Hyderabad / South Sindh)', 'Harvest or season', 'FAO-56 stages (ini/dev/mid/late, days)', 'Kc ini / mid / end', 'Root depth', 'Salt threshold ECe, rating', 'N-fixing', 'Forage use'];
const md = [
  '# Crop rules',
  '',
  'Generated from `packages/core/src/rotation/crops.ts` by `scripts/crop-rules-doc.mjs`. Do not edit by hand.',
  '',
  'Rule: no invented numbers. Every value comes from the source in brackets; "— (gap)" means no reliable source was found',
  'and the value is left out (see `docs/limitations.md`). Notes marked "proxy" borrow a closely related FAO-56 row.',
  'Kc ranges are used as a low/high band for water need; the midpoint is the central estimate.',
  '',
  `| ${head.join(' | ')} |`,
  `|${head.map(() => '---').join('|')}|`,
  ...rows.map((x) => `| ${x.join(' | ')} |`),
  '',
  '## Sources',
  '',
  ...[...used].sort().map((id) => `- **${id}**: ${SOURCES[id].title}. ${SOURCES[id].url}`),
  '',
].join('\n');
writeFileSync(new URL('../docs/crop-rules.md', import.meta.url), md);
console.log(`wrote docs/crop-rules.md (${rows.length} crops, ${used.size} sources)`);
