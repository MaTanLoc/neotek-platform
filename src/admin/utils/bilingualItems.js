export const itemIdentity = (item, index) => item?.key || `legacy-${index}`
export const pairIdentity = (item, index, locale = 'vi') => item?.key ? `${locale}:${item.key}` : `${locale}-${index}`

// Display pairing only: never rewrites imported keys or locale content.
export function pairBilingualItems(viItems, enItems, compatible = () => true) {
  const used = new Set()
  const pairs = viItems.map((vi, viIndex) => {
    const enIndex = vi.key ? enItems.findIndex((en, index) => !used.has(index) && en.key === vi.key) : -1
    if (enIndex >= 0) used.add(enIndex)
    return { id: pairIdentity(vi, viIndex), vi, viIndex, en: enItems[enIndex], enIndex }
  })
  for (const pair of pairs) {
    if (pair.enIndex >= 0) continue
    const index = pair.viIndex
    if (enItems[index] && !used.has(index) && compatible(pair.vi, enItems[index])) {
      pair.enIndex = index; pair.en = enItems[index]; used.add(index)
    }
  }
  enItems.forEach((en, enIndex) => { if (!used.has(enIndex)) pairs.push({ id: pairIdentity(en, enIndex, 'en'), en, enIndex, viIndex: -1 }) })
  return pairs
}
