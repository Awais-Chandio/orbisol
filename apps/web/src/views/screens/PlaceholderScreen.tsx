/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useTranslation } from 'react-i18next';
import { useFieldStore } from '@/stores/fieldStore';
import { NeedPin } from '@/views/components/NeedPin';

/** Shell for Must screens; content arrives in Phase 5. */
export function PlaceholderScreen({ screen }: { screen: 'farm' | 'season' | 'rotations' | 'calendar' }) {
  const { t } = useTranslation();
  const pin = useFieldStore((s) => s.pin);
  return (
    <section className="screen">
      <h1>{t('screens.' + screen + '.title')}</h1>
      <p className="lead">{t('screens.' + screen + '.intro')}</p>
      {pin ? <div className="card light"><p>{t('placeholder.coming')}</p></div> : <NeedPin />}
    </section>
  );
}
