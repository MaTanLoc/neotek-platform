import { API_BASE_URL } from '../../../config/api'
import { getLocalizedPath } from '../../../i18n'

function localizeLinks(content, language) {
  const href = url => url?.startsWith('/') && !url.startsWith('//') ? getLocalizedPath(url, language) : url
  for (const hero of content.heroSlides || content.hero || []) {
    hero.primaryUrl = href(hero.primaryUrl)
    hero.secondaryUrl = href(hero.secondaryUrl)
  }
  for (const cta of [content.ctaSection, content.footerCta].filter(Boolean)) {
    cta.primaryUrl = href(cta.primaryUrl)
    cta.secondaryUrl = href(cta.secondaryUrl)
  }
  for (const copy of Object.values(content.sectionCopy || {})) {
    if (copy.ctaUrl) copy.ctaUrl = href(copy.ctaUrl)
    if (copy.actions) copy.actions = copy.actions.map(action => ({ ...action, url: href(action.url) }))
  }
  if (content.solutionOverview?.items) content.solutionOverview = { ...content.solutionOverview, items: content.solutionOverview.items.map(item => ({ ...item, modules: (item.modules || []).map(module => ({ ...module, url: href(module.url) })) })) }
  return content
}

function htmlToText(value = '') {
  if (!value) return ''
  if (typeof document === 'undefined') return value.replace(/<[^>]*>/g, '').trim()
  const element = document.createElement('textarea')
  element.innerHTML = value
  return element.value.replace(/<[^>]*>/g, '').trim()
}

function sectionMap(response) {
  return new Map((Array.isArray(response?.sections) ? response.sections : [])
    .map((section) => [section.key, section.content || {}]))
}

function section(response, key) {
  return sectionMap(response).get(key) || {}
}

function itemId(item, index) {
  return item?.id ?? item?.key ?? index
}

function normalizeHero(content) {
  return (content.slides || []).map((item, index) => ({
    id: itemId(item, index),
    slideKey: item.key || '',
    image: item.desktopImage || null,
    mobileImage: item.mobileImage || null,
    imagePosition: item.imagePosition || 'center',
    mobileImagePosition: item.mobileImagePosition || item.imagePosition || 'center',
    overlay: item.overlay || 'dark-left',
    contentPosition: item.contentPosition || 'left',
    showContent: item.showContent !== false,
    eyebrow: item.eyebrow || '',
    headline: item.headline || '',
    description: htmlToText(item.description),
    titleLine1: item.titleLine1 || '',
    titleHighlight: item.titleHighlight || '',
    showPrimaryCta: item.primaryCta?.enabled !== false,
    primaryLabel: item.primaryCta?.label || '',
    primaryUrl: item.primaryCta?.url || '',
    showSecondaryCta: item.secondaryCta?.enabled !== false,
    secondaryLabel: item.secondaryCta?.label || '',
    secondaryUrl: item.secondaryCta?.url || '',
  }))
}

function normalizeSolutionGroups(content) {
  return (content.items || []).map((item, index) => ({
    id: itemId(item, index),
    key: item.key || '',
    icon: item.icon || null,
    modules: item.modules || [],
    eyebrow: item.eyebrow || '',
    title: item.title || '',
    description: htmlToText(item.description),
    visualSrc: item.visualSrc || null,
    visualLabel: item.visualLabel || '',
  }))
}

function normalizeSolutionModules(content) {
  return Object.fromEntries((content.items || []).map((item, index) => [
    item.key || itemId(item, index),
    {
      slug: item.slug || '',
      key: item.key,
      ctaLabel: item.ctaLabel || '',
      icon: item.icon || '',
      visualSrc: item.visualSrc || null,
      title: item.title || '',
      description: htmlToText(item.description),
      bullets: item.bullets || [],
    },
  ]))
}

const HOME_SOLUTION_CLUSTER_KEYS = [
  'business',
  'supplyChain',
  'manufacturing',
  'management',
]

function normalizeHomeSolutionClusters(content) {
  const items = Array.isArray(content?.items) ? content.items : []

  const clusters = new Map()

  const modules = new Map(
    HOME_SOLUTION_CLUSTER_KEYS.map((key) => [key, []]),
  )

  items.forEach((item, index) => {
    if (!item) return

    const key = String(item.key || '')
    const clusterKey = String(item.clusterKey || '')

    // 4 nhóm giải pháp chính
    if (HOME_SOLUTION_CLUSTER_KEYS.includes(key)) {
      clusters.set(key, {
        id: itemId(item, index),
        clusterKey: key,

        // Không dùng key kỹ thuật làm label ngoài giao diện
        label: item.label || '',

        title: item.title || '',
        description: htmlToText(item.description),
        media: item.image || item.media || null,
        modules: [],
      })

      return
    }

    // Các phân hệ nằm bên trong nhóm
    if (HOME_SOLUTION_CLUSTER_KEYS.includes(clusterKey)) {
      modules.get(clusterKey).push({
        id: itemId(item, index),
        key,
        title: item.title || item.label || key,
      })
    }
  })

  return HOME_SOLUTION_CLUSTER_KEYS
    .map((clusterKey) => {
      const cluster = clusters.get(clusterKey)

      if (!cluster) return null

      return {
        ...cluster,
        modules: modules.get(clusterKey) || [],
      }
    })
    .filter(Boolean)
}

function normalizeHome(response) {
  const why = section(response, 'why')
  const proof = section(response, 'proofMetrics')
  const logos = section(response, 'trustedBy')
  const clusters = section(response, 'solutionClusters')
  const testimonials = section(response, 'testimonials')
  const cta = section(response, 'cta')
  const faq = section(response, 'faq')

  return {
    sectionCopy: Object.fromEntries(sectionMap(response)),
    solutionOverview: section(response, 'solutions'),
    heroSlides: normalizeHero(section(response, 'hero')),
    whyItems: (why.items || []).map((item, index) => ({
      id: itemId(item, index),
      title: item.title || '',
      description: htmlToText(item.description),
      icon: item.icon || null,
      displayOrder: Number(item.displayOrder || 0),
    })),
    solutionClusters: normalizeHomeSolutionClusters(clusters),
    proofMetrics: (proof.items || []).map((item, index) => ({
      id: itemId(item, index),
      metricKey: item.key || '',
      value: Number(item.value || 0),
      suffix: item.suffix || '',
      title: item.label || '',
      subtitle: htmlToText(item.subtitle),
    })),
    trustedLogos: (logos.items || []).map((item, index) => ({
      id: itemId(item, index),
      src: item.url || '',
      alt: item.alt || item.key || '',
      width: Number(item.width || 150),
      scale: Number(item.scale || 1),
      maxWidth: item.maxWidth, height: item.height, objectFit: item.objectFit,
    })).filter((item) => item.src),
    testimonials: (testimonials.items || []).map((item, index) => ({
      id: itemId(item, index),
      quote: htmlToText(item.quote),
      person: item.name || '',
      role: item.role || '',
      organization: item.company || '',
      avatar: item.image || null,
      focalX: item.focalX ?? 50,
      focalY: item.focalY ?? 50,
      zoom: item.zoom ?? 1,
      logo: item.logo || null,
    })),
    footerCta: normalizeCta(section(response, 'footerCta').items?.[0]),
    ctaSection: normalizeCta(cta.items?.[0]),
    faqs: (faq.items || []).map((item, index) => ({
      id: itemId(item, index),
      question: item.question || '',
      answerHtml: item.answer || '',
    })),
  }
}

function normalizeCta(item) {
  if (!item) return null
  return {
    id: itemId(item, 0),
    eyebrow: item.eyebrow || '',
    title: item.title || '',
    description: htmlToText(item.description),
    showPrimaryCta: item.primary?.enabled !== false,
    primaryVariant: item.primary?.variant || 'primary',
    secondaryVariant: item.secondary?.variant || 'secondary',
    showSecondaryCta: item.secondary?.enabled !== false,
    primaryLabel: item.primary?.label || '',
    primaryUrl: item.primary?.url || '',
    secondaryLabel: item.secondary?.label || '',
    secondaryUrl: item.secondary?.url || '',
  }
}

const pendingPages = new Map()
function getPage(slug, language = 'vi') {
  const key = `${slug}:${language}`
  if (pendingPages.has(key)) return pendingPages.get(key)
  const task = fetchPage(slug, language).finally(() => pendingPages.delete(key))
  pendingPages.set(key, task)
  return task
}

async function fetchPage(slug, language) {
  const url = `${API_BASE_URL}/pages/${encodeURIComponent(slug)}?locale=${encodeURIComponent(language || 'vi')}`
  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error(`Unable to load ${slug} content from the Neotek API.`)
  }
  if (!response.ok) throw Object.assign(new Error(`Unable to load ${slug} content from the Neotek API (${response.status}).`), { status: response.status })
  const data = await response.json()
  if (!data || data.slug !== slug || !Array.isArray(data.sections)) {
    throw new Error(`Invalid ${slug} content response from the Neotek API.`)
  }
  return data
}

export const backendApiAdapter = {
  async getSolutionDetail(slug, language = 'vi') {
    const response = await getPage(slug, language)
    if (response.kind !== 'SOLUTION_DETAIL') throw Object.assign(new Error('Solution detail not found'), { status: 404 })
    return { ...response, hero: section(response, 'hero'), article: section(response, 'article'), related: section(response, 'related') }
  },
  async getSolutionDetails() {
    const response = await fetch(`${API_BASE_URL}/pages/solution-details`)
    if (!response.ok) throw new Error('Unable to load solution detail availability')
    return response.json()
  },
  async getHomePage(language = 'vi') {
    return localizeLinks(normalizeHome(await getPage('home', language)), language)
  },
  getCachedHomePage() {
    return null
  },
  async getSolutionsPage(language = 'vi') {
    const response = await getPage('solutions', language)
    const faq = section(response, 'faq')
    const cta = section(response, 'cta')
    const hero = section(response, 'hero')
    const groups = section(response, 'groups')
    const modules = section(response, 'modules')
    const availability = await backendApiAdapter.getSolutionDetails().catch(() => [])
    const solutionModules = normalizeSolutionModules(modules)
    for (const item of Object.values(solutionModules)) item.detailAvailable = availability.some(detail => detail.slug === item.slug && detail.locales.includes(language))
    return localizeLinks({
      sectionCopy: Object.fromEntries(sectionMap(response)),
      trustedLogos: normalizeHome(response).trustedLogos,
      hero: normalizeHero(hero),
      solutionGroups: normalizeSolutionGroups(groups),
      solutionModules,
      detailAvailability: availability,
      ctaSection: normalizeCta(cta.items?.[0]),
      faqs: (faq.items || []).map((item, index) => ({
        id: itemId(item, index),
        question: item.question || '',
        answerHtml: item.answer || '',
      })),
    }, language)
  },
}
