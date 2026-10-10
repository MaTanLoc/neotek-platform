// Booking is enabled by default; set VITE_FEATURE_BOOKING=false to disable it.
export const FEATURES = Object.freeze({
  booking: import.meta.env.VITE_FEATURE_BOOKING !== 'false',
})

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
export const GOOGLE_LOGIN = Object.freeze({
  enabled: import.meta.env.VITE_FEATURE_GOOGLE_LOGIN === 'true' && /^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(googleClientId),
  clientId: googleClientId,
})

export function isPublicHrefEnabled(href) {
  if (!href) return true
  try {
    const url = new URL(href, window.location.origin)
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return false
    if (url.origin !== window.location.origin) return true
    const path = url.pathname.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '')
    if (/^\/booking(?:\/|$)/.test(path)) return FEATURES.booking
    return true
  } catch { return false }
}
