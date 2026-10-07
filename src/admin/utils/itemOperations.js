export function moveItem(items, index, direction) {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

export function updateItem(items, index, patch) {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
}

