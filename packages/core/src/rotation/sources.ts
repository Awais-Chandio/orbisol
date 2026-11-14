/**
 * Orbisol core - cited sources for crop rules. Every crop value points to one of these.
 * Retrieved and checked on 2026-11-14.
 * AI-assisted: drafted with Claude (Anthropic); every value was read from the source pages listed. See docs/ai-usage.md.
 */
export const SOURCES = {
  fao56_t11: {
    title: 'FAO-56 (Allen et al. 1998), Table 11: lengths of crop development stages',
    url: 'https://www.fao.org/4/x0490e/x0490e0b.htm',
  },
  fao56_t12: {
    title: 'FAO-56 (Allen et al. 1998), Table 12: single crop coefficients Kc',
    url: 'https://www.fao.org/4/x0490e/x0490e0b.htm',
  },
  fao56_t19: {
    title: 'FAO-56 (Allen et al. 1998), Table 19: typical soil water characteristics for different soil types',
    url: 'https://www.fao.org/4/x0490e/x0490e0c.htm',
  },
  fao56_t22: {
    title: 'FAO-56 (Allen et al. 1998), Table 22: maximum effective rooting depth and depletion fraction p',
    url: 'https://www.fao.org/4/x0490e/x0490e0e.htm',
  },
  fao56_t23: {
    title: 'FAO-56 (Allen et al. 1998), Table 23: salt tolerance (from FAO-29, Ayers & Westcot)',
    url: 'https://www.fao.org/4/x0490e/x0490e0e.htm',
  },
  sindh_sowing: {
    title: 'Sindh Agriculture, Supply & Prices Department: district-wise sowing periods and sowing dates',
    url: 'https://agri.sindh.gov.pk/showing-period',
  },
  feedipedia_berseem: {
    title: 'Heuzé et al. 2016. Berseem (Trifolium alexandrinum). Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://www.feedipedia.org/node/248',
  },
  feedipedia_sorghum: {
    title: 'Heuzé et al. 2015. Sorghum forage. Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://www.feedipedia.org/node/379',
  },
  feedipedia_mung: {
    title: 'Heuzé et al. 2015. Mung bean (Vigna radiata). Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://feedipedia.org/node/235',
  },
  feedipedia_chickpea: {
    title: 'Heuzé et al. 2015. Chickpea (Cicer arietinum). Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://www.feedipedia.org/node/319',
  },
  feedipedia_wheat: {
    title: 'Heuzé et al. 2015. Wheat grain. Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://feedipedia.org/node/223',
  },
  feedipedia_rice_straw: {
    title: 'Heuzé & Tran 2015. Rice straw. Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://www.feedipedia.org/node/557',
  },
  feedipedia_sugarcane: {
    title: 'Heuzé et al. 2018. Sugarcane forage, whole plant. Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://www.feedipedia.org/node/14462',
  },
  feedipedia_cotton: {
    title: 'Heuzé et al. 2019. Cottonseed meal. Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://www.feedipedia.org/node/550',
  },
  feedipedia_sunflower: {
    title: 'Heuzé et al. 2015. Sunflower seeds. Feedipedia (INRAE, CIRAD, AFZ, FAO)',
    url: 'https://www.feedipedia.org/node/40',
  },
  feedipedia_sunflower_residue: {
    title: 'Feedipedia: Sunflower forage and crop residues',
    url: 'https://www.feedipedia.org/node/143',
  },
  feedipedia_mung_straw: {
    title: 'Feedipedia: Mung bean (Vigna radiata), straw',
    url: 'https://www.feedipedia.org/node/12352',
  },
  feedipedia_chickpea_straw: {
    title: 'Feedipedia: Chickpea straw',
    url: 'https://www.feedipedia.org/node/11976',
  },
  dawn_mung_2007: {
    title: 'Dawn, 16 Apr 2007: "Mungbean: a rich source of protein" (newspaper; check locally)',
    url: 'https://www.dawn.com/news/242480/mungbean-a-rich-source-of-protein',
  },
} as const;

export type SourceId = keyof typeof SOURCES;

/** A value with the source it was read from, and an optional note (e.g. proxy or interpretation). */
export interface Cited<T> {
  value: T;
  source: SourceId;
  note?: string;
}
