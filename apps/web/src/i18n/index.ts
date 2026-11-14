/**
 * Orbisol web - i18n setup. English first; Urdu/Sindhi (RTL) can be added as locales later.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

export const RTL_LANGS = new Set(['ur', 'sd']);

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
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
