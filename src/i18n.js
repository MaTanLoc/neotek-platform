import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import vi from './locales/vi.json'
import en from './locales/en.json'

const storageKey = 'neotek-language'

const getLanguageFromPath = () => {
  const path = window.location.pathname

  return path === '/en' || path.startsWith('/en/')
    ? 'en'
    : 'vi'
}

const initialLanguage = getLanguageFromPath()

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },

    lng: initialLanguage,

    fallbackLng: 'vi',

    supportedLngs: ['vi', 'en'],

    interpolation: {
      escapeValue: false,
    },
  })

export function setLanguage(language) {
  const nextLanguage = language === 'en' ? 'en' : 'vi'

  window.localStorage.setItem(storageKey, nextLanguage)

  return i18n.changeLanguage(nextLanguage)
}

export function getLanguageFromPathname(pathname = window.location.pathname) {
  return pathname === '/en' || pathname.startsWith('/en/')
    ? 'en'
    : 'vi'
}

export function getLocalizedPath(pathname, language) {
  const rawPath = pathname || '/'

  const normalizedPath = rawPath.startsWith('/')
    ? rawPath
    : `/${rawPath}`

  // Remove existing /en prefix first.
  const pathWithoutLocale =
    normalizedPath === '/en'
      ? '/'
      : normalizedPath.replace(/^\/en(?=\/|$)/, '') || '/'

  if (language === 'en') {
    return pathWithoutLocale === '/'
      ? '/en/'
      : `/en${pathWithoutLocale}`
  }

  return pathWithoutLocale
}

export default i18n