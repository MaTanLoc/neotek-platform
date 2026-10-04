export function optimizeCloudinaryImage(src, width = 1920) {
  if (typeof src !== 'string' || !Number.isInteger(width) || width <= 0) return src

  try {
    const url = new URL(src)
    if (url.host !== 'res.cloudinary.com' || url.username || url.password || !['https:', 'http:'].includes(url.protocol)) return src
    const match = url.pathname.match(/^\/[^/]+\/image\/upload\/(.+)$/)
    if (!match || url.search || url.hash) return src

    // Leave signed and already transformed URLs untouched; their rules belong to the CMS.
    const asset = match[1]
    if (/^(?:s--|[a-z]{1,3}_)/.test(asset) || /\.(?:gif|svg)$/i.test(asset)) return src
    url.pathname = url.pathname.replace('/image/upload/', `/image/upload/c_limit,w_${width}/q_auto/f_auto/`)
    return url.href
  } catch {
    return src
  }
}
