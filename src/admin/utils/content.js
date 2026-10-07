// decodeFirst preserves the historical Hero draft normalization contract.
export function htmlText(value, { decodeFirst = false } = {}) {
  if (decodeFirst) {
    const element = document.createElement('textarea')
    element.innerHTML = value || ''
    return element.value.replace(/<[^>]*>/g, '').trim()
  }
  const element = document.createElement('template')
  element.innerHTML = String(value || '')
  return element.content.textContent || ''
}
const plain = value => htmlText(value, { decodeFirst: true })
export function heroDraft(slide = {}) {
  return { ...slide, id: slide.key, image: slide.desktopImage, description: plain(slide.description), primaryLabel: slide.primaryCta?.label, primaryUrl: slide.primaryCta?.url, secondaryLabel: slide.secondaryCta?.label, secondaryUrl: slide.secondaryCta?.url, showContent: slide.showContent !== false, showPrimaryCta: slide.primaryCta?.enabled !== false, showSecondaryCta: slide.secondaryCta?.enabled !== false }
}
