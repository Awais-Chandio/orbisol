/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { HeroGlobe } from '@/views/components/HeroGlobe';
import { lazy, Suspense, useEffect, useState } from 'react';
import { NdviPlayButton } from '@/views/components/NdviPlayButton';
import { useReducedMotion } from '@/views/useReducedMotion';
import { useSearchParams } from 'react-router-dom';
import { latestCompleteYear, midMonthCompositeDate } from '@/config/map';
import { NdviLegend } from '@/views/components/NdviLegend';
import { MonthSlider } from '@/views/components/MonthSlider';
import type { MapLayer } from '@/views/components/FieldMap';
import { CheckCircle, Crosshair, Farm, Flask, MapPin, NavigationArrow, Scales } from '@phosphor-icons/react';
import { useTour } from '@/views/tour/Tour';
import { useTranslation } from 'react-i18next';
import { useFieldPicker } from '@/controllers/useFieldPicker';
import { CoordinateForm } from '@/views/components/CoordinateForm';
import { ErrorText } from '@/views/components/ErrorText';
import { PlaceSearch } from '@/views/components/PlaceSearch';

const FieldMap = lazy(() => import('@/views/components/FieldMap'));

export function FieldScreen() {
  const { t } = useTranslation();
  const { pin, status, gpsError, locate, pickOnMap, enterManually, useDemoField, useDemoPunjab } = useFieldPicker();
  const tour = useTour();
  // Map layer and month live in the URL, so other screens can link straight to the greenness map.
  const [params, setParams] = useSearchParams();
  const layer: MapLayer = params.get('layer') === 'ndvi' ? 'ndvi' : 'true';
  const monthParam = Number(params.get('month'));
  // Greenness opens at January (start of the year's story); ?month= still picks a month.
  const month = monthParam >= 1 && monthParam <= 12 ? monthParam : 1;
  const year = latestCompleteYear();
  const [ndviFailed, setNdviFailed] = useState(false);
  const showNdvi = layer === 'ndvi' && !ndviFailed;
  const setLayer = (l: MapLayer) => {
    if (l === 'ndvi') setNdviFailed(false);
    const next = new URLSearchParams(params);
    if (l === 'ndvi') next.set('layer', 'ndvi');
    else next.delete('layer');
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const setMonth = (m: number) => {
    const next = new URLSearchParams(params);
    next.set('month', String(m));
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const compositeDate = midMonthCompositeDate(year, month);

  // Greenness time-lapse: step Jan -> Dec, waiting for each month's tiles, then hold ~1 s; stops after December.
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  // True only after Pause during a run: Play then resumes there; otherwise Play starts again from January.
  const [pausedMidRun, setPausedMidRun] = useState(false);
  const [idleDate, setIdleDate] = useState<string | null>(null);
  const tilesIn = idleDate === compositeDate;
  useEffect(() => {
    if (!playing) return;
    if (!showNdvi || reduceMotion) {
      setPlaying(false);
      return;
    }
    const step = () => (month >= 12 ? setPlaying(false) : setMonth(month + 1));
    // Tiles in: hold this month for a second. Still loading: wait, but never more than 8 s (slow server).
    const timer = setTimeout(step, tilesIn ? 1000 : 8000);
    return () => clearTimeout(timer);
    // setMonth is rebuilt every render from the current URL; month is the dependency that matters
  }, [playing, tilesIn, month, showNdvi, reduceMotion]);
  const onPlayPress = () => {
    if (reduceMotion) return setMonth(month >= 12 ? 1 : month + 1);
    if (playing) {
      setPlaying(false);
      setPausedMidRun(month < 12);
      return;
    }
    if (!pausedMidRun || month >= 12) setMonth(1);
    setPausedMidRun(false);
    setPlaying(true);
  };

  return (
    <section className="screen">
      <div className="field-hero">
        <h1>{t('field.title')}</h1>
        <HeroGlobe />
      </div>
      <p className="value-line">{t('field.value')}</p>
      <button type="button" className="btn btn-secondary btn-small tour-start" onClick={tour.start}>
        <NavigationArrow size={20} aria-hidden /> {t('tour.start')}
      </button>
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
        <div className="segmented map-switch" role="group" aria-label={t('map.layerLabel')}>
          {(['true', 'ndvi'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={(l === 'ndvi') === showNdvi} onClick={() => setLayer(l)}>
              {t('map.layer.' + l)}
            </button>
          ))}
        </div>
        {showNdvi && (
          <div className="ndvi-panel">
            <NdviPlayButton playing={playing} waiting={!tilesIn} reduceMotion={reduceMotion} onPress={onPlayPress} />
            <MonthSlider
              month={month}
              year={year}
              compositeDate={compositeDate}
              onChange={(m) => {
                setPlaying(false);
                setPausedMidRun(false);
                setMonth(m);
              }}
            />
            <NdviLegend />
          </div>
        )}
        {ndviFailed && layer === 'ndvi' && <p className="small form-error" role="status">{t('map.ndviFailed')}</p>}
        <Suspense fallback={<div className="field-map map-loading">{t('field.mapLoading')}</div>}>
          <FieldMap pin={pin} onPick={pickOnMap} layer={showNdvi ? 'ndvi' : 'true'} ndviDate={compositeDate} onNdviError={() => setNdviFailed(true)} onIdle={setIdleDate} />
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
