/**
 * Orbisol core - crop rules for the Hyderabad (Sindh) case study.
 * RULE: no invented numbers. Every value is read from a source in ./sources.ts. Values that could not be
 * found in a reliable source are left out (undefined) and listed in docs/limitations.md.
 * Ranges are kept as [low, high]. Dates are MM-DD for Hyderabad / South Sindh.
 * AI-assisted: values transcribed by Claude (Anthropic) from the cited pages; see docs/crop-rules.md.
 */
import type { Cited } from './sources';

export type CropId =
  | 'cotton'
  | 'wheat'
  | 'rice'
  | 'sugarcane'
  | 'berseem'
  | 'mungbean'
  | 'sorghum_fodder'
  | 'sunflower'
  | 'chickpea';

export type Family = 'Malvaceae' | 'Poaceae' | 'Fabaceae' | 'Asteraceae';
export type Season = 'kharif' | 'rabi' | 'spring' | 'perennial';
export type ForageUse = 'fodder' | 'residue' | 'none';
/** FAO-29 rating: S sensitive, MS moderately sensitive, MT moderately tolerant, T tolerant. */
export type SaltRating = 'S' | 'MS' | 'MT' | 'T';

export interface SowWindow {
  from: string; // MM-DD
  to: string; // MM-DD
}

export interface CropRule {
  id: CropId;
  name: string;
  family: Cited<Family>;
  season: Season;
  sowing: Cited<SowWindow>;
  /** Harvest window when the source gives one. */
  harvest?: Cited<SowWindow>;
  /** Typical days from sowing to (last) harvest when no harvest window is given. */
  seasonDays?: Cited<number>;
  /** FAO-56 stage lengths [initial, development, mid-season, late] (days; scaled to the actual season). */
  stages: Cited<[number, number, number, number]>;
  kc: Cited<{ ini: number; mid: [number, number]; end: [number, number] }>;
  rootDepthM?: Cited<[number, number]>;
  /** FAO-56 Table 22 soil water depletion fraction for no stress (p), for ETc about 5 mm/day. */
  depletionP?: Cited<number>;
  salt?: Cited<{ thresholdECe?: number; slopePct?: number; rating: SaltRating }>;
  nitrogenFixing: Cited<boolean>;
  forage?: Cited<ForageUse>;
  /** Short facts that matter for local review (risks, practice). */
  notes: Cited<string>[];
}

export const CROPS: Record<CropId, CropRule> = {
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    family: { value: 'Malvaceae', source: 'feedipedia_cotton' },
    season: 'kharif',
    sowing: { value: { from: '05-01', to: '05-31' }, source: 'sindh_sowing', note: 'Hyderabad district: May' },
    harvest: { value: { from: '09-15', to: '10-31' }, source: 'sindh_sowing', note: 'Thatta, Tharparkar, Hyderabad' },
    stages: { value: [30, 50, 60, 55], source: 'fao56_t11', note: 'Mar-May planting; Egypt, Pakistan, California' },
    kc: { value: { ini: 0.35, mid: [1.15, 1.2], end: [0.5, 0.7] }, source: 'fao56_t12' },
    rootDepthM: { value: [1.0, 1.7], source: 'fao56_t22' },
    depletionP: { value: 0.65, source: 'fao56_t22' },
    salt: { value: { thresholdECe: 7.7, slopePct: 5.2, rating: 'T' }, source: 'fao56_t23' },
    nitrogenFixing: { value: false, source: 'feedipedia_cotton', note: 'Malvaceae, not a legume' },
    forage: { value: 'none', source: 'feedipedia_cotton', note: 'cottonseed meal is a feed by-product, not forage' },
    notes: [],
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    family: { value: 'Poaceae', source: 'feedipedia_wheat' },
    season: 'rabi',
    sowing: { value: { from: '11-01', to: '11-20' }, source: 'sindh_sowing', note: 'Hyderabad district; early varieties' },
    harvest: { value: { from: '03-01', to: '03-31' }, source: 'sindh_sowing', note: 'South Sindh: full month of March' },
    stages: { value: [25, 35, 65, 40], source: 'fao56_t11', note: 'small grains, Oct/Nov planting, Pakistan; arid region' },
    kc: { value: { ini: 0.3, mid: [1.15, 1.15], end: [0.25, 0.4] }, source: 'fao56_t12', note: 'spring wheat; Kc ini from cereals group' },
    rootDepthM: { value: [1.0, 1.5], source: 'fao56_t22', note: 'spring wheat' },
    depletionP: { value: 0.55, source: 'fao56_t22', note: 'spring wheat' },
    salt: { value: { thresholdECe: 6.0, slopePct: 7.1, rating: 'MT' }, source: 'fao56_t23', note: 'Triticum aestivum' },
    nitrogenFixing: { value: false, source: 'feedipedia_wheat', note: 'Poaceae, not a legume' },
    notes: [],
  },
  rice: {
    id: 'rice',
    name: 'Rice',
    family: { value: 'Poaceae', source: 'feedipedia_rice_straw' },
    season: 'kharif',
    sowing: { value: { from: '04-15', to: '05-15' }, source: 'sindh_sowing', note: 'Hyderabad district (nursery)' },
    harvest: { value: { from: '09-01', to: '10-31' }, source: 'sindh_sowing', note: 'South Sindh: September to October' },
    stages: { value: [30, 30, 60, 30], source: 'fao56_t11', note: 'Tropics; Mediterranean' },
    kc: { value: { ini: 1.05, mid: [1.2, 1.2], end: [0.6, 0.9] }, source: 'fao56_t12' },
    rootDepthM: { value: [0.5, 1.0], source: 'fao56_t22' },
    salt: { value: { thresholdECe: 3.0, slopePct: 12.0, rating: 'S' }, source: 'fao56_t23' },
    nitrogenFixing: { value: false, source: 'feedipedia_rice_straw', note: 'Poaceae, not a legume' },
    forage: { value: 'residue', source: 'feedipedia_rice_straw', note: 'rice straw is fed to livestock' },
    notes: [],
  },
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    family: { value: 'Poaceae', source: 'feedipedia_sugarcane' },
    season: 'perennial',
    sowing: { value: { from: '02-10', to: '03-30' }, source: 'sindh_sowing', note: 'spring planting (autumn planting Sep-Oct)' },
    harvest: { value: { from: '12-01', to: '02-28' }, source: 'sindh_sowing', note: 'December to February' },
    stages: { value: [35, 60, 190, 120], source: 'fao56_t11', note: 'virgin crop, low latitudes (405 days)' },
    kc: { value: { ini: 0.4, mid: [1.25, 1.25], end: [0.75, 0.75] }, source: 'fao56_t12' },
    rootDepthM: { value: [1.2, 2.0], source: 'fao56_t22' },
    depletionP: { value: 0.65, source: 'fao56_t22' },
    salt: { value: { thresholdECe: 1.7, slopePct: 5.9, rating: 'MS' }, source: 'fao56_t23' },
    nitrogenFixing: { value: false, source: 'feedipedia_sugarcane', note: 'Poaceae, not a legume' },
    forage: { value: 'residue', source: 'feedipedia_sugarcane', note: 'whole plant and tops used as forage' },
    notes: [],
  },
  berseem: {
    id: 'berseem',
    name: 'Berseem (Egyptian clover)',
    family: { value: 'Fabaceae', source: 'feedipedia_berseem' },
    season: 'rabi',
    sowing: {
      value: { from: '10-01', to: '10-31' },
      source: 'feedipedia_berseem',
      note: '"usually sown in early autumn", read as October for Sindh; check locally',
    },
    seasonDays: {
      value: 195,
      source: 'feedipedia_berseem',
      note: 'first cut 50-60 days after sowing, then every 30-40 days, 5-6 cuts under irrigation: 55 + 4 x 35 = 195 days to the 5th cut',
    },
    stages: {
      value: [10, 20, 155, 10],
      source: 'fao56_t11',
      note: 'proxy: initial/development/late from Alfalfa 1st cutting cycle (no berseem row in Table 11)',
    },
    kc: { value: { ini: 0.4, mid: [0.9, 0.9], end: [0.85, 0.85] }, source: 'fao56_t12', note: 'berseem, averaged cutting effects' },
    rootDepthM: { value: [0.6, 0.9], source: 'fao56_t22' },
    depletionP: { value: 0.5, source: 'fao56_t22', note: 'clover hay, berseem' },
    salt: { value: { thresholdECe: 1.5, slopePct: 5.7, rating: 'MS' }, source: 'fao56_t23', note: 'Feedipedia calls it moderately tolerant; FAO-56 rates it MS' },
    nitrogenFixing: { value: true, source: 'feedipedia_berseem', note: '"Berseem is an N-fixing legume"' },
    forage: { value: 'fodder', source: 'feedipedia_berseem', note: 'high-quality green fodder, cut and carried' },
    notes: [
      { value: 'As a winter crop it provides soil cover and prevents erosion.', source: 'feedipedia_berseem' },
      { value: 'Some frost tolerance, down to about -6 °C.', source: 'feedipedia_berseem' },
      { value: 'Under irrigation it must be sown earlier and irrigated weekly at the start.', source: 'feedipedia_berseem' },
    ],
  },
  mungbean: {
    id: 'mungbean',
    name: 'Mung bean',
    family: { value: 'Fabaceae', source: 'feedipedia_mung' },
    season: 'kharif',
    sowing: { value: { from: '06-01', to: '07-31' }, source: 'dawn_mung_2007', note: 'kharif crop "sown during the months of June and July"' },
    seasonDays: { value: 75, source: 'dawn_mung_2007', note: 'varieties mature in 75-77 days' },
    stages: { value: [20, 30, 30, 20], source: 'fao56_t11', note: 'green gram and cowpeas (Mediterranean)' },
    kc: { value: { ini: 0.4, mid: [1.05, 1.05], end: [0.35, 0.6] }, source: 'fao56_t12', note: 'green gram; Kc ini from legumes group' },
    rootDepthM: { value: [0.6, 1.0], source: 'fao56_t22', note: 'green gram and cowpeas' },
    depletionP: { value: 0.45, source: 'fao56_t22', note: 'green gram and cowpeas' },
    nitrogenFixing: { value: true, source: 'feedipedia_mung', note: '"a N-fixing legume"' },
    forage: { value: 'residue', source: 'feedipedia_mung_straw', note: 'mung bean straw is used as feed' },
    notes: [{ value: 'Spring crop is sown 15 Feb to 15 Mar.', source: 'dawn_mung_2007' }],
  },
  sorghum_fodder: {
    id: 'sorghum_fodder',
    name: 'Sorghum (fodder)',
    family: { value: 'Poaceae', source: 'feedipedia_sorghum' },
    season: 'kharif',
    sowing: { value: { from: '05-01', to: '06-30' }, source: 'fao56_t11', note: 'sorghum, May/June planting; USA, Pakistan, Mediterranean' },
    seasonDays: { value: 80, source: 'feedipedia_sorghum', note: 'in Pakistan, sorghum hay harvested 80 days after sowing' },
    stages: { value: [20, 35, 40, 30], source: 'fao56_t11', note: 'sorghum (scaled to the 80-day fodder season)' },
    kc: { value: { ini: 0.3, mid: [1.0, 1.1], end: [0.55, 0.55] }, source: 'fao56_t12', note: 'sorghum grain; Kc ini from cereals group' },
    rootDepthM: { value: [1.0, 2.0], source: 'fao56_t22' },
    depletionP: { value: 0.55, source: 'fao56_t22', note: 'sorghum grain' },
    salt: { value: { thresholdECe: 6.8, slopePct: 16.0, rating: 'MT' }, source: 'fao56_t23' },
    nitrogenFixing: { value: false, source: 'feedipedia_sorghum', note: 'Poaceae, not a legume' },
    forage: { value: 'fodder', source: 'feedipedia_sorghum' },
    notes: [
      { value: 'Promoted as a substitute for more water-consuming forage crops where water is limited.', source: 'feedipedia_sorghum' },
      { value: 'Fresh-cut forage can contain HCN (cyanide); feed it fast, or as hay or silage.', source: 'feedipedia_sorghum' },
    ],
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    family: { value: 'Asteraceae', source: 'feedipedia_sunflower' },
    season: 'spring',
    sowing: { value: { from: '02-01', to: '02-28' }, source: 'sindh_sowing', note: 'spring crop: whole month of February (autumn crop: August)' },
    seasonDays: { value: 130, source: 'fao56_t11', note: 'Table 11 total length (Mediterranean; California)' },
    stages: { value: [25, 35, 45, 25], source: 'fao56_t11' },
    kc: { value: { ini: 0.35, mid: [1.0, 1.15], end: [0.35, 0.35] }, source: 'fao56_t12', note: 'Kc ini from oil crops group' },
    rootDepthM: { value: [0.8, 1.5], source: 'fao56_t22' },
    depletionP: { value: 0.45, source: 'fao56_t22' },
    salt: { value: { rating: 'MS' }, source: 'fao56_t23', note: 'no threshold value given' },
    nitrogenFixing: { value: false, source: 'feedipedia_sunflower', note: 'Asteraceae, not a legume' },
    forage: { value: 'residue', source: 'feedipedia_sunflower_residue' },
    notes: [],
  },
  chickpea: {
    id: 'chickpea',
    name: 'Chickpea (gram)',
    family: { value: 'Fabaceae', source: 'feedipedia_chickpea' },
    season: 'rabi',
    sowing: { value: { from: '10-15', to: '11-30' }, source: 'sindh_sowing', note: 'gram' },
    harvest: { value: { from: '03-15', to: '04-15' }, source: 'sindh_sowing', note: 'gram' },
    stages: {
      value: [25, 35, 70, 40],
      source: 'fao56_t11',
      note: 'proxy: lentil, Oct/Nov planting, arid region (no chickpea row in Table 11)',
    },
    kc: { value: { ini: 0.4, mid: [1.0, 1.0], end: [0.35, 0.35] }, source: 'fao56_t12', note: 'chick pea; Kc ini from legumes group' },
    rootDepthM: { value: [0.6, 1.0], source: 'fao56_t22' },
    depletionP: { value: 0.5, source: 'fao56_t22' },
    nitrogenFixing: { value: true, source: 'feedipedia_chickpea', note: '"N-fixing legume (up to 100 kg N/ha)"' },
    forage: { value: 'residue', source: 'feedipedia_chickpea_straw' },
    notes: [
      { value: 'Often used to restore soil fertility before cereal or oilseed crops.', source: 'feedipedia_chickpea' },
    ],
  },
};

export const CROP_IDS = Object.keys(CROPS) as CropId[];
