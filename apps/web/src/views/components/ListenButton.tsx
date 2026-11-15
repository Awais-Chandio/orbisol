/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useEffect, useState } from 'react';
import { SpeakerHigh, Stop } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** Reads the plain sentences aloud with the browser's own speech (no network, no new dependency). Hidden if unsupported. */
export function ListenButton({ sentences }: { sentences: string[] }) {
  const { t } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const ok = supported();
  useEffect(() => () => void (ok && window.speechSynthesis.cancel()), [ok]);
  if (!ok) return null;

  // Symbols that speech engines read badly: arrows between crops and number ranges.
  const spoken = sentences
    .map((s) => s.replace(/\s*→\s*/g, ` ${t('listen.then')} `).replace(/(\d)\s*–\s*(\d)/g, `$1 ${t('listen.to')} $2`))
    .join(' ');

  const toggle = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(spoken);
    u.lang = 'en-US';
    u.rate = 0.95;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('en'));
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  return (
    <button type="button" className="science-toggle listen-btn" onClick={toggle} aria-pressed={speaking} disabled={sentences.length === 0}>
      {speaking ? <Stop size={20} aria-hidden /> : <SpeakerHigh size={20} aria-hidden />}
      {speaking ? t('listen.stop') : t('listen.play')}
    </button>
  );
}
