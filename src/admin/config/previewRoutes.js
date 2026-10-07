const PUBLIC_ROUTES = {
  home: { vi: '/', en: '/en' },
  solutions: { vi: '/solutions', en: '/en/solutions' },
}

export function getPublicPreviewRoute(slug, locale) {
  return PUBLIC_ROUTES[slug]?.[locale] || null
}
