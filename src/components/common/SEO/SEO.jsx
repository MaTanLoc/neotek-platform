import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getLanguageFromPathname } from '../../../i18n'

const SITE_URL = 'https://neotek.vn'
const localizedRoutes = ['/', '/solutions', '/booking', '/login', '/register']
const descriptions = {
  vi: 'Neotek — Nền tảng quản trị doanh nghiệp.',
  en: 'Neotek — Enterprise management platform.',
}
const routeTitles = {
  '/': { vi: 'Neotek | Nền tảng quản trị doanh nghiệp', en: 'Neotek | Enterprise management platform' },
  '/solutions': { vi: 'Giải pháp quản trị doanh nghiệp | Neotek', en: 'Enterprise management solutions | Neotek' },
  '/booking': { vi: 'Đặt lịch demo | Neotek', en: 'Book a demo | Neotek' },
  '/login': { vi: 'Đăng nhập | Neotek', en: 'Sign in | Neotek' },
  '/register': { vi: 'Đăng ký | Neotek', en: 'Register | Neotek' },
}

// Reuse existing fallback tags and remove duplicates, including in StrictMode.
function updateHeadElement(selector, tagName, attributes) {
  const matches = [...document.head.querySelectorAll(selector)]
  const element = matches.shift() || document.createElement(tagName)
  matches.forEach((duplicate) => duplicate.remove())
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
  if (!element.parentNode) document.head.appendChild(element)
}

export default function SEO({ title, description, robots = 'index, follow', type = 'website', image = '/assets/logo/logo_306x98.png' }) {
  const { pathname } = useLocation()
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const language = getLanguageFromPathname(normalizedPath)
  const basePath = normalizedPath.replace(/^\/en(?=\/|$)/, '') || '/'
  const resolvedTitle = title || routeTitles[basePath]?.[language] || 'Neotek'
  const resolvedDescription = description || descriptions[language]

  useEffect(() => {
    const canonical = `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`
    const imageUrl = new URL(image, SITE_URL).href
    document.title = resolvedTitle
    document.documentElement.lang = language

    const meta = (attribute, name, content) => updateHeadElement(
      `meta[${attribute}="${name}"]`, 'meta', { [attribute]: name, content },
    )
    meta('name', 'description', resolvedDescription)
    meta('name', 'robots', robots)
    meta('property', 'og:title', resolvedTitle)
    meta('property', 'og:description', resolvedDescription)
    meta('property', 'og:type', type)
    meta('property', 'og:url', canonical)
    meta('property', 'og:image', imageUrl)
    meta('property', 'og:locale', language === 'en' ? 'en_US' : 'vi_VN')
    meta('name', 'twitter:card', 'summary_large_image')
    meta('name', 'twitter:title', resolvedTitle)
    meta('name', 'twitter:description', resolvedDescription)
    meta('name', 'twitter:image', imageUrl)
    updateHeadElement('link[rel="canonical"]', 'link', { rel: 'canonical', href: canonical })

    // Unknown URLs have no verified translation counterpart. Clear stale alternates.
    if (!localizedRoutes.includes(basePath)) {
      document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((element) => element.remove())
      return
    }
    const viUrl = `${SITE_URL}${basePath === '/' ? '' : basePath}`
    const enUrl = `${SITE_URL}/en${basePath === '/' ? '' : basePath}`
    for (const [hreflang, href] of [['vi', viUrl], ['en', enUrl], ['x-default', viUrl]]) {
      updateHeadElement(`link[rel="alternate"][hreflang="${hreflang}"]`, 'link', { rel: 'alternate', hreflang, href })
    }
  }, [normalizedPath, basePath, language, resolvedTitle, resolvedDescription, robots, type, image])

  return null
}
