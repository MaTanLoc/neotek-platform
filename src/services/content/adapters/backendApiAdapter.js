import { API_BASE_URL } from '../../../config/api'

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
    description: item.description || '',
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
    visualLabel: item.visualLabel || '',
  }))
}

function normalizeSolutionModules(content) {
  return Object.fromEntries((content.items || []).map((item, index) => [
    item.key || itemId(item, index),
    {
      icon: item.icon || '',
      visualSrc: item.visualSrc || null,
      title: item.title || '',
      description: item.description || '',
      bullets: item.bullets || [],
    },
  ]))
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
    heroSlides: normalizeHero(section(response, 'hero')),
    whyItems: (why.items || []).map((item, index) => ({
      id: itemId(item, index),
      title: item.title || '',
      description: htmlToText(item.description),
      icon: item.icon || null,
      displayOrder: Number(item.displayOrder || 0),
    })),
    solutionClusters: (clusters.items || []).map((item, index) => ({
      id: itemId(item, index),
      clusterKey: item.key || '',
      label: item.label || item.key || '',
      title: item.title || '',
      description: htmlToText(item.description),
      media: item.image || null,
      modules: item.modules || [],
    })),
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
    })).filter((item) => item.src),
    testimonials: (testimonials.items || []).map((item, index) => ({
      id: itemId(item, index),
      quote: htmlToText(item.quote),
      person: item.name || '',
      role: item.role || '',
      organization: item.company || '',
      avatar: item.image || null,
      logo: item.logo || null,
    })),
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
    primaryLabel: item.primary?.label || '',
    primaryUrl: item.primary?.url || '',
    secondaryLabel: item.secondary?.label || '',
    secondaryUrl: item.secondary?.url || '',
  }
}

async function getPage(slug, language) {
  const url = `${API_BASE_URL}/pages/${encodeURIComponent(slug)}?locale=${encodeURIComponent(language || 'vi')}`
  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error(`Unable to load ${slug} content from the Neotek API.`)
  }
  if (!response.ok) throw new Error(`Unable to load ${slug} content from the Neotek API (${response.status}).`)
  const data = await response.json()
  if (!data || data.slug !== slug || !Array.isArray(data.sections)) {
    throw new Error(`Invalid ${slug} content response from the Neotek API.`)
  }
  return data
}

export const backendApiAdapter = {
  async getHomePage(language = 'vi') {
    return normalizeHome(await getPage('home', language))
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
    return {
      trustedLogos: [],
      hero: normalizeHero(hero),
      solutionGroups: normalizeSolutionGroups(groups),
      solutionModules: normalizeSolutionModules(modules),
      ctaSection: normalizeCta(cta.items?.[0]),
      faqs: (faq.items || []).map((item, index) => ({
        id: itemId(item, index),
        question: item.question || '',
        answerHtml: item.answer || '',
      })),
    }
  },
}
