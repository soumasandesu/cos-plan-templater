import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import hkTranslations from './locales/hk.json';
import enTranslations from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      hk: {
        translation: hkTranslations
      },
      en: {
        translation: enTranslations
      },
    },
    lng: 'hk', // 預設語言
    fallbackLng: 'hk', // 如果找不到翻譯就用呢個
    interpolation: {
      escapeValue: false // React 已經會 escape，所以唔需要
    }
  });

export default i18n;

