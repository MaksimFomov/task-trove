import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import be from './locales/be.json';
import kk from './locales/kk.json';
import hy from './locales/hy.json';
import az from './locales/az.json';
import ka from './locales/ka.json';
import uz from './locales/uz.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uk: { translation: uk },
  be: { translation: be },
  kk: { translation: kk },
  hy: { translation: hy },
  az: { translation: az },
  ka: { translation: ka },
  uz: { translation: uz },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'uk', 'be', 'kk', 'hy', 'az', 'ka', 'uz'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

