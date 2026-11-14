/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMonthDay, monthName } from '@/views/format';

/**
 * Month slider for the greenness map (native range input: arrow keys, Home/End and touch work; the value is read out
 * as the month name). Shows which 16-day MODIS composite the map is using.
 */
export function MonthSlider({ month, year, compositeDate, onChange }: { month: number; year: number; compositeDate: string; onChange: (m: number) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const name = `${monthName(month, 'long')} ${year}`;
  return (
    <div className="month-slider">
      <label htmlFor={id} className="month-slider-label">
        {t('map.sliderLabel')}
      </label>
      <p className="month-slider-value" aria-live="polite">
        <strong>{name}</strong> <span className="small">{t('map.composite', { date: formatMonthDay(compositeDate.slice(5)) + ' ' + compositeDate.slice(0, 4) })}</span>
      </p>
      <input
        id={id}
        type="range"
        min={1}
        max={12}
        step={1}
        value={month}
        aria-valuetext={name}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <ol className="month-slider-ticks" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i} className={i + 1 === month ? 'is-on' : ''}>
            {monthName(i + 1).slice(0, 1)}
          </li>
        ))}
      </ol>
    </div>
  );
}
