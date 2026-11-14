/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useTranslation } from 'react-i18next';
import { SourceTag } from '@/views/components/SourceTag';
import { JudgmentFlag } from '@/views/components/JudgmentFlag';

const CREDITS: { name: string; use: string; url: string }[] = [
  { name: 'NASA POWER (daily, agroclimatology)', use: 'Rain, heat, frost, humidity, sunlight', url: 'https://power.larc.nasa.gov/' },
  { name: 'NASA GPM IMERG', use: 'Rainfall and extreme-rain days', url: 'https://gpm.nasa.gov/data/imerg' },
  { name: 'MODIS and VIIRS NOAA-20 vegetation indices (ORNL DAAC)', use: 'Greenness (NDVI)', url: 'https://modis.ornl.gov/' },
  { name: 'NASA SMAP', use: 'Soil moisture', url: 'https://smap.jpl.nasa.gov/' },
  { name: 'NASA SRTM', use: 'Slope and erosion risk', url: 'https://www.earthdata.nasa.gov/data/instruments/srtm' },
  { name: 'NASA GIBS (VIIRS NOAA-20 true color)', use: 'Map imagery', url: 'https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api' },
  { name: 'FAO GAEZ v4 and FAO-56', use: 'Crop requirements and water needs', url: 'https://gaez.fao.org/' },
  { name: 'GeoNames gazetteer (CC BY 4.0)', use: 'Offline town and village search', url: 'https://www.geonames.org/' },
];

export function AboutScreen() {
  const { t } = useTranslation();
  return (
    <section className="screen">
      <h1>{t('about.title')}</h1>
      <p className="lead">{t('about.what')}</p>
      <p className="small">{t('about.event')}</p>

      <h2>{t('about.kindsTitle')}</h2>
      <ul className="plain-list">
        <li><SourceTag provenance={{ source: 'NASA SMAP', kind: 'satellite', date: '2026-11-10' }} /></li>
        <li><SourceTag provenance={{ source: 'NASA POWER', kind: 'model', date: '2026-11-10' }} /></li>
        <li><SourceTag provenance={{ source: 'FAO-56', kind: 'reference', date: '1998' }} /></li>
        <li><SourceTag provenance={{ source: 'Your canal turn', kind: 'farmer', date: '2026-11-14' }} /></li>
      </ul>
      <p><JudgmentFlag reason="sowing dates, local pests and market prices" /></p>

      <h2>{t('about.credits')}</h2>
      <ul className="credit-list">
        {CREDITS.map((c) => (
          <li key={c.name}>
            <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a>
            <span className="small">{c.use}</span>
          </li>
        ))}
      </ul>
      <p className="small">{t('about.noLogos')}</p>
      <p className="small">{t('about.ai')}</p>
    </section>
  );
}
