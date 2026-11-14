/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useId } from 'react';
import { ArrowCounterClockwise, Plus, Trash } from '@phosphor-icons/react';
import { CROP_IDS, type CropId } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import { useFarmProfile } from '@/controllers/useFarmProfile';
import { PARTS, ROTATION_PRESETS, type MonthPart } from '@/models/farm';
import { JudgmentFlag } from '@/views/components/JudgmentFlag';
import { PriorityPicker } from '@/views/components/PriorityPicker';
import { SourceTag } from '@/views/components/SourceTag';
import { monthName } from '@/views/format';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function DatePick({ label, md, onChange }: { label: string; md: string; onChange: (m: number, p: MonthPart) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const month = Number(md.slice(0, 2));
  const day = Number(md.slice(3, 5));
  const part: MonthPart = day <= 10 ? 'early' : day <= 20 ? 'mid' : 'late';
  return (
    <fieldset className="date-pick">
      <legend>{label}</legend>
      <select id={id + 'p'} aria-label={t('farm.part')} value={part} onChange={(e) => onChange(month, e.target.value as MonthPart)}>
        {(Object.keys(PARTS) as MonthPart[]).map((p) => (
          <option key={p} value={p}>{t('farm.parts.' + p)}</option>
        ))}
      </select>
      <select id={id + 'm'} aria-label={t('farm.month')} value={month} onChange={(e) => onChange(Number(e.target.value), part)}>
        {MONTHS.map((m) => (
          <option key={m} value={m}>{monthName(m, 'long')}</option>
        ))}
      </select>
    </fieldset>
  );
}

export function FarmScreen() {
  const { t } = useTranslation();
  const f = useFarmProfile();
  const today = new Date().toISOString().slice(0, 10);
  const farmerProv = { source: t('sources.farmer'), kind: 'farmer' as const, date: today };

  return (
    <section className="screen">
      <h1>{t('farm.title')}</h1>
      <p className="lead">{t('farm.intro')}</p>

      <div className="farm-grid">
      <div className="card light farm-rotation">
        <h2>{t('farm.rotationTitle')}</h2>
        <p className="small">{t('farm.rotationHint')}</p>
        <fieldset className="preset-row">
          <legend>{t('farm.presets')}</legend>
          {ROTATION_PRESETS.map((p) => {
            const on = JSON.stringify(p.rotation) === JSON.stringify(f.farm.rotation);
            return (
              <button key={p.id} type="button" className="chip" aria-pressed={on} onClick={() => f.set({ rotation: p.rotation })}>
                {p.rotation.map((x) => t('crops.' + x.crop)).join(' → ')}
              </button>
            );
          })}
          <p className="small">{t('farm.presetsHint')}</p>
        </fieldset>
        <ol className="slot-list">
          {f.farm.rotation.map((s, i) => (
            <li key={i} className="slot">
              <label className="field">
                {t('farm.crop')}
                <select value={s.crop} onChange={(e) => f.setCrop(i, e.target.value as CropId)}>
                  {CROP_IDS.map((c) => (
                    <option key={c} value={c}>{t('crops.' + c)}</option>
                  ))}
                </select>
              </label>
              <DatePick label={t('farm.sow')} md={s.sow} onChange={(m, p) => f.setDate(i, 'sow', m, p)} />
              <DatePick label={t('farm.harvest')} md={s.harvest} onChange={(m, p) => f.setDate(i, 'harvest', m, p)} />
              {f.farm.rotation.length > 1 && (
                <button type="button" className="btn btn-secondary btn-small" onClick={() => f.removeSlot(i)}>
                  <Trash size={16} aria-hidden /> {t('farm.removeCrop')}
                </button>
              )}
            </li>
          ))}
        </ol>
        {f.farm.rotation.length < 3 && (
          <button type="button" className="btn btn-secondary" onClick={f.addSlot}>
            <Plus size={24} aria-hidden /> {t('farm.addCrop')}
          </button>
        )}
        <p><SourceTag provenance={farmerProv} /></p>
      </div>

      <div className="farm-side">
      <div className="card light">
        <h2>{t('farm.prioritiesTitle')}</h2>
        <p className="small">{t('farm.prioritiesHint')}</p>
        <PriorityPicker value={f.farm.priorities} onChange={(priorities) => f.set({ priorities })} />
      </div>

      <div className="card light" id="canal">
        <h2>{t('farm.canalTitle')}</h2>
        <div className="canal-row">
          <label className="field">
            {t('farm.canalEvery')}
            <input
              type="number" inputMode="numeric" min={1} max={60}
              value={f.farm.canal?.intervalDays ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= 60) f.set({ canal: { intervalDays: Math.round(v), hours: f.farm.canal?.hours ?? 1 } });
              }}
            />
          </label>
          <label className="field">
            {t('farm.canalHours')}
            <input
              type="number" inputMode="decimal" min={0.25} max={72} step={0.25}
              value={f.farm.canal?.hours ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 0.25 && v <= 72) f.set({ canal: { intervalDays: f.farm.canal?.intervalDays ?? 7, hours: v } });
              }}
            />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={f.farm.canal === null} onChange={(e) => f.set({ canal: e.target.checked ? null : { intervalDays: 7, hours: 1 } })} />
          {t('farm.canalNone')}
        </label>
      </div>

      <div className="card light">
        <h2>{t('farm.soilTitle')}</h2>
        <fieldset className="radio-row">
          <legend>{t('farm.texture')}</legend>
          {(['sandy', 'loam', 'clay'] as const).map((x) => (
            <label key={x} className="radio">
              <input type="radio" name="texture" checked={f.farm.soil.texture === x} onChange={() => f.set({ soil: { ...f.farm.soil, texture: x } })} />
              {t('farm.textures.' + x)}
            </label>
          ))}
        </fieldset>
        <fieldset className="radio-row">
          <legend>{t('farm.salty')}</legend>
          {([['yes', true], ['no', false], ['unknown', null]] as const).map(([k, v]) => (
            <label key={k} className="radio">
              <input type="radio" name="salty" checked={f.farm.soil.salty === v} onChange={() => f.set({ soil: { ...f.farm.soil, salty: v } })} />
              {t('farm.' + k)}
            </label>
          ))}
        </fieldset>
        <p className="small"><JudgmentFlag reason={t('farm.judgment')} /></p>
      </div>
      </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-secondary" onClick={f.reset}>
          <ArrowCounterClockwise size={24} aria-hidden /> {t('farm.reset')}
        </button>
      </div>
    </section>
  );
}
