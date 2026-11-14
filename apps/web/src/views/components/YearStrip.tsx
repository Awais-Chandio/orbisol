/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { CloudRain, Snowflake, ThermometerHot } from '@phosphor-icons/react';
import type { MonthCell } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import { monthName } from '@/views/format';

/** 12-month strip: crop or bare per month, with hazard icons. Crops are labelled in text, never by colour alone. */
export function YearStrip({ months }: { months: MonthCell[] }) {
  const { t } = useTranslation();
  return (
    <div className="year-strip" role="table" aria-label={t('rotations.yearStrip')}>
      {months.map((m) => {
        const crop = m.crops[0]?.crop;
        const bare = !crop || m.bareDays >= 15;
        const label = bare ? t('rotations.bare') : t('crops.' + crop);
        return (
          <div key={m.month} className={'ys-cell' + (bare ? ' ys-bare' : '')} role="row" title={`${monthName(m.month, 'long')}: ${label}`}>
            <span className="ys-month" role="cell">{monthName(m.month).slice(0, 1)}</span>
            <span className="ys-crop" role="cell">{bare ? '–' : label.slice(0, 3)}</span>
            <span className="ys-hz" role="cell" aria-label={m.hazards.map((h) => t('hazards.' + h)).join(', ')}>
              {m.hazards.includes('hot') && <ThermometerHot size={12} aria-hidden />}
              {m.hazards.includes('heavyRain') && <CloudRain size={12} aria-hidden />}
              {m.hazards.includes('frost') && <Snowflake size={12} aria-hidden />}
            </span>
          </div>
        );
      })}
    </div>
  );
}
