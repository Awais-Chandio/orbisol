/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { lazy, Suspense } from 'react';
import { CheckCircle, Crosshair, Farm, Flask, MapPin, Scales } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useFieldPicker } from '@/controllers/useFieldPicker';
import { CoordinateForm } from '@/views/components/CoordinateForm';
import { ErrorText } from '@/views/components/ErrorText';
import { PlaceSearch } from '@/views/components/PlaceSearch';

const FieldMap = lazy(() => import('@/views/components/FieldMap'));

export function FieldScreen() {
  const { t } = useTranslation();
  const { pin, status, gpsError, locate, pickOnMap, enterManually, useDemoField, useDemoPunjab } = useFieldPicker();

  return (
    <section className="screen">
      <h1>{t('field.title')}</h1>
      <p className="value-line">{t('field.value')}</p>
      <ol className="steps" aria-label={t('field.stepsLabel')}>
        {[MapPin, Farm, Scales].map((I, i) => (
          <li key={i} className={i === 0 ? 'is-current' : ''} aria-current={i === 0 ? 'step' : undefined}>
            <span className="step-num">{i + 1}</span>
            <I size={20} aria-hidden />
            <span>{t('field.steps.' + i)}</span>
          </li>
        ))}
      </ol>

      <div className="field-layout">
      <div className="btn-row field-actions">
        <button className="btn btn-primary" onClick={() => void locate()} disabled={status === 'locating'}>
          <Crosshair size={24} aria-hidden />
          {status === 'locating' ? t('field.locating') : t('field.useGps')}
        </button>
        <button className="btn btn-secondary" onClick={useDemoField}>
          <Flask size={24} aria-hidden />
          {t('field.useDemo')}
        </button>
        <button className="btn btn-secondary btn-demo2" onClick={useDemoPunjab}>
          <Flask size={24} aria-hidden />
          {t('field.useDemo2')}
        </button>
      </div>
      {gpsError && (
        <ErrorText>{t('field.gpsError.' + gpsError)}</ErrorText>
      )}

      <div className="field-search">
        <PlaceSearch />
      </div>

      <div className="field-map-wrap">
        <Suspense fallback={<div className="field-map map-loading">{t('field.mapLoading')}</div>}>
          <FieldMap pin={pin} onPick={pickOnMap} />
        </Suspense>
        <p className="hint">{t('field.tapHint')}</p>
      </div>

      <div className="card light pin-card" aria-live="polite">
        {pin ? (
          <>
            <p className="pin-status">
              <CheckCircle size={24} aria-hidden /> <strong>{t('field.pinned')}</strong>{' '}
              ({t('field.source.' + pin.source)})
            </p>
            <p className="mono">
              {pin.lat.toFixed(4)}, {pin.lon.toFixed(4)}
              {pin.label ? ' · ' + pin.label : ''}
            </p>
            {pin.accuracyM !== undefined && <p className="small">{t('field.accuracy', { m: pin.accuracyM })}</p>}
          </>
        ) : (
          <p>{t('field.noPin')}</p>
        )}
      </div>

      <details className="manual">
        <summary>{t('field.manualTitle')}</summary>
        <CoordinateForm key={pin ? pin.lat + ',' + pin.lon : 'none'} initial={pin} onSubmit={enterManually} />
      </details>
      </div>
    </section>
  );
}
