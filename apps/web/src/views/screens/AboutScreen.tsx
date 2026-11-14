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
  { name: 'NASA GPM IMERG', use: 'Rainfall and extreme-rain days (pipeline)', url: 'https://gpm.nasa.gov/data/imerg' },
  { name: 'MODIS Terra MOD13Q1 NDVI and MCD12Q1 land cover (ORNL DAAC)', use: 'Cropland greenness (NDVI) (pipeline)', url: 'https://modis.ornl.gov/' },
  { name: 'NASA SRTM (SRTMGL1 v003)', use: 'Slope class and erosion context (pipeline)', url: 'https://www.earthdata.nasa.gov/data/instruments/srtm' },
  { name: 'NASA NEX-GDDP-CMIP6 via NASA Center for Climate Simulation (NCCS) THREDDS', use: '2050 hot-day projection: ACCESS-CM2, MPI-ESM1-2-HR, MRI-ESM2-0; SSP2-4.5 and SSP5-8.5 (pipeline)', url: 'https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6' },
];

const REFERENCE: Credit[] = [
  { name: 'FAO-56 (Allen et al. 1998), Tables 11, 12, 22, 23', use: 'ET0 method, crop stages, crop coefficients, rooting depth, salt tolerance', url: 'https://www.fao.org/4/x0490e/x0490e00.htm' },
  { name: 'Sindh Agriculture, Supply & Prices Department', use: 'Sowing and harvest windows for Hyderabad / South Sindh', url: 'https://agri.sindh.gov.pk/showing-period' },
  { name: 'FAO (2006) Guidelines for soil description, Table 7', use: 'Slope classes', url: 'https://www.fao.org/4/a0541e/a0541e.pdf' },
  { name: 'Feedipedia (INRAE, CIRAD, AFZ, FAO)', use: 'Plant families, legumes, fodder use, berseem and sorghum practice', url: 'https://www.feedipedia.org/' },
  { name: 'Dawn (2007), "Mungbean: a rich source of protein"', use: 'Mung bean sowing months and season length (check locally)', url: 'https://www.dawn.com/news/242480/mungbean-a-rich-source-of-protein' },
  { name: 'ETCCDI climate indices (Zhang et al. 2011) and WMO 1991-2020 normals', use: 'Frost days, heavy-rain days, hot days, normals', url: 'https://doi.org/10.1002/wcc.147' },
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
        <li><SourceTag provenance={{ source: 'NASA GPM IMERG', kind: 'satellite', date: '2026-11-10' }} /></li>
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
