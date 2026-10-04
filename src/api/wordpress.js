const WORDPRESS_API =
   import.meta.env.VITE_WORDPRESS_API ||
   'http://neotek-cms.local/wp-json/wp/v2'

const HOMEPAGE_CACHE_TTL = import.meta.env.DEV ? 5_000 : 60_000
const CACHE_TTL = HOMEPAGE_CACHE_TTL
const responseCache = new Map()
const pendingRequests = new Map()
const homepageCache = new Map()
const homepagePending = new Map()
let cacheGeneration = 0

function toBoolean(value) {
   return value === true || value === 1 || value === '1'
}

function htmlToText(html = '') {
   if (!html) return ''

   if (typeof document === 'undefined') {
      return html.replace(/<[^>]*>/g, '').trim()
   }

   const element = document.createElement('textarea')
   element.innerHTML = html

   return element.value.replace(/<[^>]*>/g, '').trim()
}

function isActive(item) {
   const value = item?.acf?.is_active
   return value !== false && value !== 0 && value !== '0'
}

function sortByDisplayOrder(items) {
   return [...items].sort(
      (a, b) =>
         Number(a?.acf?.display_order ?? 0) -
         Number(b?.acf?.display_order ?? 0),
   )
}

function filterByLanguage(items, language) {
   if (!language) return items

   return items.filter(
      (item) => item?.acf?.language === language,
   )
}

function buildQuery(params = {}) {
   const query = new URLSearchParams()

   Object.entries(params).forEach(([key, value]) => {
      if (
         value === undefined ||
         value === null ||
         value === ''
      ) {
         return
      }

      query.set(key, String(value))
   })

   return query.toString()
}

async function wordpressFetch(postType, params = {}) {
   const query = buildQuery({
      per_page: 100,
      acf_format: 'standard',
      _fields: 'id,title,content,acf',
      ...params,
   })

   const url = `${WORDPRESS_API}/${postType}?${query}`

   const cached = responseCache.get(url)

   if (
      cached &&
      Date.now() - cached.timestamp < CACHE_TTL
   ) {
      return cached.data
   }

   if (pendingRequests.has(url)) {
      return pendingRequests.get(url)
   }

   const generation = cacheGeneration
   const request = fetch(url)
      .then(async (response) => {
         if (!response.ok) {
            throw new Error(
               `WordPress request failed: ${postType} (${response.status})`,
            )
         }

         const data = await response.json()

         if (!Array.isArray(data)) {
            throw new Error(`Invalid WordPress collection: ${postType}`)
         }

         if (generation === cacheGeneration) {
            responseCache.set(url, { data, timestamp: Date.now() })
         }

         return data
      })
      .finally(() => {
         pendingRequests.delete(url)
      })

   pendingRequests.set(url, request)

   return request
}

async function getCollection(
   postType,
   {
      language = null,
      onlyActive = true,
      sort = true,
      params = {},
   } = {},
) {
   let items = await wordpressFetch(postType, params)

   if (onlyActive) {
      items = items.filter(isActive)
   }

   if (language) {
      items = filterByLanguage(items, language)
   }

   if (sort) {
      items = sortByDisplayOrder(items)
   }

   return items
}

async function getSingle(postType, options = {}) {
   const items = await getCollection(postType, options)
   return items[0] ?? null
}


/* =========================
   NORMALIZERS
   ========================= */

function normalizeHeroSlide(item) {
   return {
      id: item.id,
      slideKey: item.acf?.slide_key ?? '',
      image: item.acf?.image_url ?? null,
      mobileImage: item.acf?.mobile_image_url ?? null,
      imagePosition: item.acf?.image_position || 'center',
      mobileImagePosition:
         item.acf?.mobile_image_position ||
         item.acf?.image_position ||
         'center',
      overlay: item.acf?.overlay || 'dark-left',
      contentPosition:
         item.acf?.content_position || 'left',
      showContent:
         toBoolean(item.acf?.show_content),
      eyebrow: item.acf?.eyebrow ?? '',
      headline: item.acf?.headline ?? '',
      description: item.acf?.description ?? '',
      showPrimaryCta:
         toBoolean(item.acf?.show_primary_cta),
      primaryLabel:
         item.acf?.primary_cta_label ?? '',
      primaryUrl:
         item.acf?.primary_url ?? '',
      showSecondaryCta:
         toBoolean(item.acf?.show_secondary_cta),
      secondaryLabel:
         item.acf?.secondary_label ?? '',
      secondaryUrl:
         item.acf?.secondary_url ?? '',
   }
}

function normalizeWhyItem(item) {
   return {
      id: item.id,
      title:
         htmlToText(item.title?.rendered ?? ''),
      description:
         htmlToText(item.content?.rendered ?? ''),
      icon: item.acf?.icon ?? null,
      displayOrder:
         Number(item.acf?.display_order ?? 0),
   }
}

function normalizeSolutionModule(item) {
   return {
      id: item.id,
      title:
         htmlToText(item.title?.rendered ?? ''),
      clusterKey:
         item.acf?.cluster_key ?? '',
      displayOrder:
         Number(item.acf?.display_order ?? 0),
   }
}

function normalizeSolutionCluster(item) {
   return {
      id: item.id,
      clusterKey:
         item.acf?.cluster_key ?? '',
      label:
         item.acf?.label ?? '',
      title:
         htmlToText(item.title?.rendered ?? ''),
      description:
         htmlToText(item.content?.rendered ?? ''),
      media:
         item.acf?.media_url ?? null,
   }
}

function normalizeProofMetric(item) {
   return {
      id: item.id,
      metricKey:
         item.acf?.metric_key ?? '',
      value:
         Number(item.acf?.value ?? 0),
      suffix:
         item.acf?.suffix ?? '',
      title:
         htmlToText(item.title?.rendered ?? ''),
      subtitle:
         htmlToText(item.content?.rendered ?? ''),
   }
}

function normalizeTrustedLogo(item) {
   return {
      id: item.id,
      src:
         item.acf?.logo_url ?? '',
      alt:
         item.acf?.alt_text ||
         htmlToText(item.title?.rendered ?? ''),
      width:
         Number(item.acf?.logo_width ?? 150),
      scale:
         Number(item.acf?.logo_scale ?? 1),
   }
}

function normalizeTestimonial(item) {
   return {
      id: item.id,
      quote:
         htmlToText(item.content?.rendered ?? ''),
      person:
         item.acf?.person_name ?? '',
      role:
         item.acf?.role ?? '',
      organization:
         item.acf?.organization ?? '',
      avatar:
         item.acf?.avatar ?? null,
      logo:
         item.acf?.logo ?? null,
   }
}

function normalizeCta(item) {
   if (!item) return null

   return {
      id: item.id,
      eyebrow:
         item.acf?.eyebrow ?? '',
      title:
         htmlToText(item.title?.rendered ?? ''),
      description:
         htmlToText(item.content?.rendered ?? ''),
      primaryLabel:
         item.acf?.primary_label ?? '',
      primaryUrl:
         item.acf?.primary_url ?? '',
      secondaryLabel:
         item.acf?.secondary_label ?? '',
      secondaryUrl:
         item.acf?.secondary_url ?? '',
   }
}

function normalizeFaq(item) {
   return {
      id: item.id,
      question:
         htmlToText(item.title?.rendered ?? ''),
      answerHtml:
         item.content?.rendered ?? '',
   }
}


/* =========================
   PUBLIC API
   ========================= */

export async function getSolutionsPageData(language = 'vi') {
   const [trustedLogos, ctaSection, faqs] = await Promise.all([
      getTrustedLogos(), getCtaSection(language), getFaqs(language),
   ])
   return { trustedLogos, ctaSection, faqs }
}

export async function getFaqs(language = 'vi') {
   const items = await getCollection('faq', {
      language,
   })

   return items.map(normalizeFaq)
}

export async function getTestimonials(
   language = 'vi',
) {
   const items = await getCollection(
      'testimonial',
      { language },
   )

   return items.map(normalizeTestimonial)
}

export async function getWhyItems(
   language = 'vi',
) {
   const items = await getCollection(
      'why_item',
      { language },
   )

   return items.map(normalizeWhyItem)
}

export async function getSolutionClusters(
   language = 'vi',
) {
   const items = await getCollection(
      'solution_cluster',
      { language },
   )

   return items.map(normalizeSolutionCluster)
}

export async function getSolutionModules(
   language = 'vi',
) {
   const items = await getCollection(
      'solution_module',
      { language },
   )

   return items.map(normalizeSolutionModule)
}

export async function getProofMetrics(
   language = 'vi',
) {
   const items = await getCollection(
      'proof_metric',
      { language },
   )

   return items.map(normalizeProofMetric)
}

export async function getTrustedLogos() {
   const items = await getCollection(
      'trusted_logo',
   )

   return items
      .map(normalizeTrustedLogo)
      .filter((logo) => Boolean(logo.src))
}

export async function getCtaSection(
   language = 'vi',
) {
   const item = await getSingle(
      'cta_section',
      { language },
   )

   return normalizeCta(item)
}

export async function getHeroSlides(
   language = 'vi',
) {
   const items = await getCollection(
      'hero_slide',
      { language, params: { _fields: 'id,acf' } },
   )

   return items.map(normalizeHeroSlide)
}


/* =========================
   HOMEPAGE
   ========================= */

async function loadHomepageData(
   language = 'vi',
) {
   const [
      heroSlides,
      whyItems,
      solutionClusters,
      solutionModules,
      proofMetrics,
      trustedLogos,
      testimonials,
      ctaSection,
      faqs,
   ] = await Promise.all([
      getHeroSlides(language),
      getWhyItems(language),
      getSolutionClusters(language),
      getSolutionModules(language),
      getProofMetrics(language),
      getTrustedLogos(),
      getTestimonials(language),
      getCtaSection(language),
      getFaqs(language),
   ])

   const clustersWithModules =
      solutionClusters.map((cluster) => ({
         ...cluster,

         modules: solutionModules
            .filter(
               (module) =>
                  module.clusterKey ===
                  cluster.clusterKey,
            )
            .sort(
               (a, b) =>
                  a.displayOrder -
                  b.displayOrder,
            ),
      }))

   return {
      heroSlides,
      whyItems,
      solutionClusters:
         clustersWithModules,
      proofMetrics,
      trustedLogos,
      testimonials,
      ctaSection,
      faqs,
   }
}


/* =========================
   CACHE
   ========================= */

export function getCachedHomepageData(language = 'vi') {
   const cached = homepageCache.get(language)
   if (!cached) return null
   if (Date.now() - cached.timestamp < HOMEPAGE_CACHE_TTL) return cached.data
   homepageCache.delete(language)
   return null
}

export function getHomepageData(language = 'vi') {
   const cached = getCachedHomepageData(language)
   if (cached) return Promise.resolve(cached)
   if (homepagePending.has(language)) return homepagePending.get(language)

   const generation = cacheGeneration
   const request = loadHomepageData(language)
      .then((data) => {
         if (generation === cacheGeneration) {
            homepageCache.set(language, { data, timestamp: Date.now() })
         }
         return data
      })
      .finally(() => homepagePending.delete(language))

   homepagePending.set(language, request)
   return request
}

export function clearWordPressCache() {
   cacheGeneration += 1
   responseCache.clear()
   homepageCache.clear()
}

// Clear both layers so collection cache cannot mask a homepage refresh.
// Pending requests stay deduplicated but cannot repopulate a cleared cache.
export function clearHomepageCache() {
   clearWordPressCache()
}
