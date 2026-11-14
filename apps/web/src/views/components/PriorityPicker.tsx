/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { PRIORITIES, PRIORITY_WEIGHTS, type Priority } from '@orbisol/core';
import { useTranslation } from 'react-i18next';

/** Tap to choose up to 3 priorities; order of tapping is the rank (weights 3/2/1). */
export function PriorityPicker({ value, onChange }: { value: Priority[]; onChange: (p: Priority[]) => void }) {
  const { t } = useTranslation();
  const toggle = (p: Priority) => {
    if (value.includes(p)) onChange(value.filter((x) => x !== p));
    else if (value.length < 3) onChange([...value, p]);
    else onChange([...value.slice(0, 2), p]);
  };
  return (
    <div className="priority-picker" role="group">
      {PRIORITIES.map((p) => {
        const i = value.indexOf(p);
        return (
          <button key={p} type="button" className="chip" aria-pressed={i >= 0} onClick={() => toggle(p)}>
            {i >= 0 && <span className="chip-rank">{i + 1}</span>}
            {t(`priorities.${p}.name`)}
            {i >= 0 && <span className="chip-weight">×{PRIORITY_WEIGHTS[i]}</span>}
          </button>
        );
      })}
    </div>
  );
}
