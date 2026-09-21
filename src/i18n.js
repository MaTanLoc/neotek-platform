import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import vi from './locales/vi.json'
import en from './locales/en.json'

const storageKey = 'neotek-language'
const savedLanguage = window.localStorage.getItem(storageKey)

void i18n
  .use(initReactI18next)
  .init({
    resources: { vi: { translation: vi }, en: { translation: en } },
    lng: savedLanguage === 'en' ? 'en' : 'vi',
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en'],
    interpolation: { escapeValue: false },
  })

export function setLanguage(language) {
  const nextLanguage = language === 'en' ? 'en' : 'vi'
  window.localStorage.setItem(storageKey, nextLanguage)
  return i18n.changeLanguage(nextLanguage)
}

export default i18n
