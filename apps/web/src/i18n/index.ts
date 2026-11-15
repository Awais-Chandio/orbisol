/**
 * Orbisol web - i18n setup. The app is English only.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = 'en';
document.documentElement.dir = 'ltr';
try {
  localStorage.removeItem('orbisol.lang'); // clear an old saved language choice (the language switch was removed)
} catch {
  /* storage blocked: nothing to clear */
}

export default i18n;
