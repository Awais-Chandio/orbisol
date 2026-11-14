/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useTranslation } from 'react-i18next';
import { SourceTag } from '@/views/components/SourceTag';
import { JudgmentFlag } from '@/views/components/JudgmentFlag';

interface Credit {
  name: string;
  use: string;
  url: string;
  license?: string;
}

const NASA: Credit[] = [
  { name: 'NASA POWER (daily, agroclimatology)', use: 'Heat, frost, rain, dew point, wind, sunlight, top-soil wetness; ET0 inputs', url: 'https://power.larc.nasa.gov/' },
  { name: 'NASA GIBS: VIIRS NOAA-20 true color, Coastlines', use: 'Map imagery', url: 'https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api' },
  { name: 'MODIS Terra MOD13Q1 NDVI and MCD12Q1 land cover (ORNL DAAC)', use: 'Cropland greenness (NDVI) (pipeline)', url: 'https://modis.ornl.gov/' },
  { name: 'NASA SRTM (SRTMGL1 v003)', use: 'Slope class and erosion context (pipeline)', url: 'https://www.earthdata.nasa.gov/data/instruments/srtm' },
  { name: 'NASA NEX-GDDP-CMIP6 via NASA Center for Climate Simulation (NCCS) THREDDS', use: '2050 hot-day projection: ACCESS-CM2, MPI-ESM1-2-HR, MRI-ESM2-0; SSP2-4.5 and SSP5-8.5 (pipeline)', url: 'https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6' },
];

/** Listed so nobody reads them as used: none of these feeds a number in this version. */
const PLANNED: Credit[] = [
  { name: 'NASA GPM IMERG V07 (satellite rain)', use: 'Satellite rain next to model rain. The download reached about 3,000 of 10,500 days before the server limit; not shipped.', url: 'https://gpm.nasa.gov/data/imerg' },
  { name: 'NASA SMAP soil moisture (SPL3SMP_E)', use: 'Satellite soil-moisture anomaly. No data was returned for the demo farm; the NASA POWER model value is used instead.', url: 'https://smap.jpl.nasa.gov/' },
  { name: 'VIIRS NOAA-20 NDVI (VJ113A1)', use: 'Replacement for MODIS Terra greenness when Terra science data ends (expected around February 2027).', url: 'https://www.earthdata.nasa.gov/data/instruments/viirs' },
];

const REFERENCE: Credit[] = [
  { name: 'FAO-56 (Allen et al. 1998), Tables 11, 12, 22, 23', use: 'ET0 method, crop stages, crop coefficients, rooting depth, salt tolerance', url: 'https://www.fao.org/4/x0490e/x0490e00.htm' },
  { name: 'Sindh Agriculture, Supply & Prices Department', use: 'Sowing and harvest windows for Hyderabad / South Sindh', url: 'https://agri.sindh.gov.pk/showing-period' },
  { name: 'FAO (2006) Guidelines for soil description, Table 7', use: 'Slope classes', url: 'https://www.fao.org/4/a0541e/a0541e.pdf' },
  { name: 'Feedipedia (INRAE, CIRAD, AFZ, FAO)', use: 'Plant families, legumes, fodder use, berseem and sorghum practice', url: 'https://www.feedipedia.org/' },
  { name: 'Dawn (2007), "Mungbean: a rich source of protein"', use: 'Mung bean sowing months and season length (check locally)', url: 'https://www.dawn.com/news/242480/mungbean-a-rich-source-of-protein' },
  { name: 'ETCCDI climate indices (Zhang et al. 2011) and WMO 1991-2020 normals', use: 'Frost days, heavy-rain days, hot days, normals', url: 'https://doi.org/10.1002/wcc.147' },
  { name: 'Khan et al. (2022), PLOS ONE 17(7): e0271626, climate extremes in the climate zones of Pakistan, 1962-2019', use: 'Published station trends compared with the observed trend card (warm nights, warm days)', url: 'https://doi.org/10.1371/journal.pone.0271626' },
  { name: 'Dawn (2013), "Pink bollworm a threat to Sindh cotton"', use: 'Pink bollworm carry-over in bolls left on cotton sticks (Sindh)', url: 'https://www.dawn.com/news/1052279' },
  { name: 'UC IPM, Pink bollworm: cotton pest management guidelines', use: 'Stalk shredding, plowdown, host-free period, rotation to small grains', url: 'https://ipm.ucanr.edu/agriculture/cotton/pink-bollworm/' },
  { name: 'Saeed et al., Bemisia tabaci host range, Multan (CottonGen poster)', use: 'Whitefly host plants (about 50 major hosts)', url: 'https://cottongen.org/node/1287558' },
  { name: 'FAO Soils Bulletin 80 (Bot & Benites 2005), chapter 5', use: 'Soil cover, residues, root channels and organic matter for infiltration', url: 'https://www.fao.org/4/a0100e/a0100e08.htm' },
  { name: 'ARY News (2026), Karachi dairy sector and fodder supply', use: 'Karachi dairy farms rely on fodder from Sindh and Balochistan', url: 'https://arynews.tv/milk-shortage-likely-in-karachi-22-july-2026' },
  { name: 'Dawn (2005), "Reaping a rich harvest from maize crop"', use: 'Green fodder net return near Hyderabad (2005 study)', url: 'https://www.dawn.com/news/139366' },
];

function CreditList({ items }: { items: Credit[] }) {
  return (
    <ul className="credit-list">
      {items.map((c) => (
        <li key={c.name}>
          <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a>
          <span className="small">{c.use}</span>
        </li>
      ))}
    </ul>
  );
}

export function AboutScreen() {
  const { t } = useTranslation();
  return (
    <section className="screen screen-narrow">
      <h1>{t('about.title')}</h1>
      <p className="lead">{t('about.what')}</p>
      <p className="small">{t('about.event')}</p>

      <h2>{t('about.kindsTitle')}</h2>
      <ul className="plain-list">
        <li><SourceTag provenance={{ source: 'NASA MODIS Terra NDVI', kind: 'satellite', date: '2026-10-16' }} /></li>
        <li><SourceTag provenance={{ source: 'NASA POWER', kind: 'model', date: '2026-11-10' }} /></li>
        <li><SourceTag provenance={{ source: 'FAO-56', kind: 'reference', date: '1998' }} /></li>
        <li><SourceTag provenance={{ source: 'Your canal turn', kind: 'farmer', date: '2026-11-14' }} /></li>
      </ul>
      <p><JudgmentFlag reason="sowing dates, local pests and market prices" /></p>

      <h2>{t('about.credits')}</h2>
      <h3>{t('about.nasaData')}</h3>
      <CreditList items={NASA} />
      <h3>{t('about.references')}</h3>
      <CreditList items={REFERENCE} />
      <h3>{t('about.planned')}</h3>
      <p className="small">{t('about.plannedHint')}</p>
      <CreditList items={PLANNED} />
      <p className="geonames-credit">
        Place names:{' '}
        <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a>,{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
      </p>
      <p className="small">{t('about.osm')}</p>
      <p className="small">{t('about.noLogos')}</p>
      <p className="small">{t('about.ai')}</p>
    </section>
  );
}
