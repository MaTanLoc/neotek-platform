export const SOLUTION_ALIASES = Object.freeze(Object.assign(Object.create(null), { 'hr-payroll': 'nhan-su-tien-luong' }))

export function buildSolutionDetailPath(slug, locale = 'vi') {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) return null
  return `${locale === 'en' ? '/en' : ''}/solutions/${SOLUTION_ALIASES[slug] || slug}`
}
