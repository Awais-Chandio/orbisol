/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Pause, Play, SkipForward } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/**
 * Play/Pause for the greenness time-lapse (Jan -> Dec). With reduced motion it never autoplays: each press steps
 * one month instead.
 */
export function NdviPlayButton({ playing, waiting, reduceMotion, onPress }: { playing: boolean; waiting: boolean; reduceMotion: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const Icon = reduceMotion ? SkipForward : playing ? Pause : Play;
  const label = reduceMotion ? t('map.play.next') : playing ? t('map.play.pause') : t('map.play.play');
  return (
    <div className="ndvi-play">
      <button type="button" className="btn btn-primary btn-small" onClick={onPress} aria-pressed={reduceMotion ? undefined : playing}>
        <Icon size={20} weight="fill" aria-hidden />
        {label}
      </button>
      <p className="ndvi-play-caption">
        <strong>{t('map.play.caption')}</strong>
        {playing && waiting && <span className="small"> · {t('map.play.loading')}</span>}
        {reduceMotion && <span className="small block">{t('map.play.stepHint')}</span>}
      </p>
    </div>
  );
}
