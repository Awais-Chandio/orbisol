/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LatLonSchema } from '@/models/field';
import { ErrorText } from './ErrorText';

interface Props {
  initial?: { lat: number; lon: number } | null;
  onSubmit: (lat: number, lon: number) => void;
}

export function CoordinateForm({ initial, onSubmit }: Props) {
  const { t } = useTranslation();
  const [lat, setLat] = useState(initial ? String(initial.lat) : '');
  const [lon, setLon] = useState(initial ? String(initial.lon) : '');
  const [error, setError] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = LatLonSchema.safeParse({ lat: Number(lat.trim()), lon: Number(lon.trim()) });
    if (!parsed.success || lat.trim() === '' || lon.trim() === '') {
      setError(true);
      return;
    }
    setError(false);
    onSubmit(parsed.data.lat, parsed.data.lon);
  }

  return (
    <form className="coord-form" onSubmit={submit} noValidate>
      <label>
        {t('field.lat')}
        <input inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="25.48" aria-invalid={error} />
      </label>
      <label>
        {t('field.lon')}
        <input inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="68.41" aria-invalid={error} />
      </label>
      <button type="submit" className="btn btn-secondary">{t('field.setPin')}</button>
      {error && <ErrorText>{t('field.invalid')}</ErrorText>}
    </form>
  );
}
