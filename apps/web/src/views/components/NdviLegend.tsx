/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useTranslation } from 'react-i18next';

/**
 * NDVI legend with words at each step (never colour alone). Colours read from the GIBS colour map for the layer
 * (colormaps/v1.3/MODIS_L3_NDVI.xml): pale/tan near 0, brown ~0.3, yellow-green from ~0.35, dark green above ~0.75.
 */
const STOPS = [
  { at: 0, rgb: '226,216,217' },
  { at: 20, rgb: '176,159,143' },
  { at: 33, rgb: '154,110,90' },
  { at: 40, rgb: '164,198,62' },
  { at: 60, rgb: '86,161,1' },
  { at: 85, rgb: '10,105,1' },
  { at: 100, rgb: '0,60,1' },
];

export function NdviLegend() {
  const { t } = useTranslation();
  const gradient = `linear-gradient(to right, ${STOPS.map((s) => `rgb(${s.rgb}) ${s.at}%`).join(', ')})`;
  return (
    <figure className="ndvi-legend" aria-label={t('map.legendAria')}>
      <div className="ndvi-bar" style={{ background: gradient }} aria-hidden />
      <ol className="ndvi-ticks">
        <li>
          <strong>0</strong> {t('map.legend.bare')}
        </li>
        <li>
          <strong>0.3</strong> {t('map.legend.sparse')}
        </li>
        <li>
          <strong>0.5</strong> {t('map.legend.growing')}
        </li>
        <li>
          <strong>0.8</strong> {t('map.legend.dense')}
        </li>
      </ol>
      <figcaption className="small">{t('map.legendCaption')}</figcaption>
    </figure>
  );
}
