/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { lazy, Suspense } from 'react';
import { ArrowRight, CheckCircle, Crosshair, Flask } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFieldPicker } from '@/controllers/useFieldPicker';
import { CoordinateForm } from '@/views/components/CoordinateForm';
import { ErrorText } from '@/views/components/ErrorText';

const FieldMap = lazy(() => import('@/views/components/FieldMap'));

export function FieldScreen() {
  const { t } = useTranslation();
  const { pin, status, gpsError, locate, pickOnMap, enterManually, useDemoField } = useFieldPicker();

  return (
    <section className="screen">
      <h1>{t('field.title')}</h1>
      <p className="lead">{t('field.intro')}</p>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => void locate()} disabled={status === 'locating'}>
          <Crosshair size={24} aria-hidden />
          {status === 'locating' ? t('field.locating') : t('field.useGps')}
        </button>
        <button className="btn btn-secondary" onClick={useDemoField}>
          <Flask size={24} aria-hidden />
          {t('field.useDemo')}
        </button>
      </div>
      {gpsError && (
        <ErrorText>{t('field.gpsError.' + gpsError)}</ErrorText>
      )}

      <Suspense fallback={<div className="field-map map-loading">{t('field.mapLoading')}</div>}>
        <FieldMap pin={pin} onPick={pickOnMap} />
      </Suspense>
      <p className="hint">{t('field.tapHint')}</p>

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
            <Link to="/farm" className="btn btn-primary">
              {t('field.next')} <ArrowRight size={24} aria-hidden />
            </Link>
          </>
        ) : (
          <p>{t('field.noPin')}</p>
        )}
      </div>

      <details className="manual">
        <summary>{t('field.manualTitle')}</summary>
        <CoordinateForm key={pin ? pin.lat + ',' + pin.lon : 'none'} initial={pin} onSubmit={enterManually} />
      </details>
    </section>
  );
}
