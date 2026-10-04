export function createSkeletonItems(count, prefix = 'skeleton') {
  return Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index}` }))
}
