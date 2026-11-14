/**
 * Orbisol web - i18n setup. English first; Urdu/Sindhi (RTL) can be added as locales later.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ur from './locales/ur';

export const RTL_LANGS = new Set(['ur', 'sd']);
export const LANGS = ['en', 'ur'] as const;
const LANG_KEY = 'orbisol.lang';

/** English is the default; a chosen language is remembered on this device when storage allows. */
function savedLang(): string {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v && (LANGS as readonly string[]).includes(v) ? v : 'en';
  } catch {
    return 'en';
  }
}

export function setLanguage(lng: (typeof LANGS)[number]) {
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {
    /* storage blocked: the choice lasts for this visit only */
  }
  void i18n.changeLanguage(lng);
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: savedLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

function applyDir(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = RTL_LANGS.has(lng) ? 'rtl' : 'ltr';
}
applyDir(i18n.language);
i18n.on('languageChanged', applyDir);

export default i18n;
