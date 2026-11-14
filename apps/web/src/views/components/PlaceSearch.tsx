/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { MagnifyingGlass, MapPin } from '@phosphor-icons/react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { placeLabel, usePlaceSearch } from '@/controllers/usePlaceSearch';
import { ErrorText } from './ErrorText';
import { SourceTag } from './SourceTag';

/** Find a town or village by name; the map then flies to it. Offline index, no OSM/Nominatim. */
export function PlaceSearch() {
  const { t } = useTranslation();
  const id = useId();
  const s = usePlaceSearch();
  const showList = !s.tooShort && s.results.length > 0;

  return (
    <div className="place-search">
      <label htmlFor={id} className="place-label">{t('field.searchLabel')}</label>
      <div className="search-box">
        <MagnifyingGlass size={24} aria-hidden />
        <input
          id={id}
          type="search"
          value={s.text}
          onChange={(e) => s.setText(e.target.value)}
          placeholder={t('field.searchPlaceholder')}
          autoComplete="off"
          enterKeyHint="search"
          aria-describedby={id + '-hint'}
        />
      </div>
      <p id={id + '-hint'} className="small" aria-live="polite">
        {s.tooShort
          ? t('field.searchHint')
          : s.isLoading
            ? t('field.searching')
            : s.results.length === 0 && !s.isError
              ? s.needMore
                ? t('field.searchMore')
                : t('field.searchNone')
              : s.needMore
                ? t('field.searchMore')
                : ''}
      </p>
      {s.isError && <ErrorText>{t('field.searchError')}</ErrorText>}
      {showList && (
        <ul className="place-results" aria-label={t('field.searchResults')}>
          {s.results.map((p) => (
            <li key={`${p.name}-${p.lat}-${p.lon}`}>
              <button type="button" onClick={() => s.choose(p)}>
                <MapPin size={24} aria-hidden />
                <span>
                  <strong>{p.name}</strong>
                  <span className="small">
                    {placeLabel(p).slice(p.name.length + 2)}
                    {s.showDistance && p.distanceKm !== undefined && ' · ' + t('field.kmAway', { km: Math.round(p.distanceKm) })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {showList && s.provenance && <SourceTag provenance={s.provenance} />}
    </div>
  );
}
