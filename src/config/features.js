// Build-time opt-in; incomplete public features fail closed by default.
export const FEATURES = Object.freeze({
  booking: import.meta.env.VITE_FEATURE_BOOKING === 'true',
  // Customer authentication has no implementation; an env flag cannot enable it.
  publicAuth: false,
})

export function isPublicHrefEnabled(href) {
  if (!href) return true
  try {
    const url = new URL(href, window.location.origin)
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return false
    if (url.origin !== window.location.origin) return true
    const path = url.pathname.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '')
    if (/^\/booking(?:\/|$)/.test(path)) return FEATURES.booking
    if (/^\/(login|register|forgot-password)(?:\/|$)/.test(path)) return FEATURES.publicAuth
    return true
  } catch { return false }
}
