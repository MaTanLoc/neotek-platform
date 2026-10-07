import { createContext } from 'react'
import { adminApi } from '../../services/admin/adminApi'

export const SolutionDetailsContext = createContext({ loading: true, entries: [] })
export const detailStatus = page => !page ? 'Chưa có' : page.status === 'PUBLISHED' ? 'Đã xuất bản' : page.status === 'ARCHIVED' ? 'Đã lưu trữ' : 'Bản nháp'

export async function loadSolutionDetails() {
  const [pages, listing] = await Promise.all([adminApi.getPages(), adminApi.getPage('solutions')])
  const details = pages.filter(page => page.kind === 'SOLUTION_DETAIL')
  const modules = listing.sections.find(section => section.type === 'solutionModules')?.translations.find(item => item.locale === 'vi')?.content.items || []
  const englishModules = listing.sections.find(section => section.type === 'solutionModules')?.translations.find(item => item.locale === 'en')?.content.items || []
  const title = page => page.translations?.find(item => item.locale === 'vi')?.title || page.slug
  const entries = modules.map(module => {
    const page = details.find(page => page.slug === module.slug)
    const readyToCreate = !!module.slug && englishModules.find(item => item.key === module.key)?.slug === module.slug
    return { key: module.key, module: module.title, title: page ? title(page) : module.title, slug: module.slug, readyToCreate, page }
  })
  for (const page of details) if (!entries.some(entry => entry.page?.id === page.id)) entries.push({ key: page.id, title: title(page), module: '—', slug: page.slug, page })
  return { loading: false, entries }
}
