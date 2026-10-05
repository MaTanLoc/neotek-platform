import { backendApiAdapter } from './adapters/backendApiAdapter.js'

/**
 * @typedef {Object} HeroSlide
 * @property {number} id
 * @property {string} slideKey
 * @property {string|null} image
 * @property {string|null} mobileImage
 * @property {string} imagePosition
 * @property {string} mobileImagePosition
 * @property {string} overlay
 * @property {string} contentPosition
 * @property {boolean} showContent
 * @property {string} eyebrow
 * @property {string} headline
 * @property {string} description
 * @property {boolean} showPrimaryCta
 * @property {string} primaryLabel
 * @property {string} primaryUrl
 * @property {boolean} showSecondaryCta
 * @property {string} secondaryLabel
 * @property {string} secondaryUrl
 *
 * @typedef {{id: number, title: string, description: string, icon: string|null, displayOrder: number}} WhyItem
 * @typedef {{id: number, title: string, clusterKey: string, displayOrder: number}} SolutionModule
 * @typedef {{id: number, clusterKey: string, label: string, title: string, description: string, media: string|null, modules: SolutionModule[]}} SolutionCluster
 * @typedef {{id: number, metricKey: string, value: number, suffix: string, title: string, subtitle: string}} ProofMetric
 * @typedef {{id: number, src: string, alt: string, width: number, scale: number}} TrustedLogo
 * @typedef {{id: number, quote: string, person: string, role: string, organization: string, avatar: string|null, logo: string|null}} Testimonial
 * @typedef {{id: number, eyebrow: string, title: string, description: string, primaryLabel: string, primaryUrl: string, secondaryLabel: string, secondaryUrl: string}} CtaSection
 * @typedef {{id: number, question: string, answerHtml: string}} Faq
 *
 * @typedef {Object} HomePageContent
 * @property {HeroSlide[]} heroSlides
 * @property {WhyItem[]} whyItems
 * @property {SolutionCluster[]} solutionClusters
 * @property {ProofMetric[]} proofMetrics
 * @property {TrustedLogo[]} trustedLogos
 * @property {Testimonial[]} testimonials
 * @property {CtaSection|null} ctaSection
 * @property {Faq[]} faqs
 *
 * @typedef {Object} SolutionsPageContent
 * @property {TrustedLogo[]} trustedLogos
 * @property {CtaSection|null} ctaSection
 * @property {Faq[]} faqs
 */

export const contentService = {
  /** @param {string} [language='vi'] @returns {Promise<HomePageContent>} */
  getHomePage(language = 'vi') {
    return backendApiAdapter.getHomePage(language)
  },

  /** @param {string} [language='vi'] @returns {HomePageContent|null} */
  getCachedHomePage(language = 'vi') {
    return backendApiAdapter.getCachedHomePage(language)
  },

  /** @param {string} [language='vi'] @returns {Promise<SolutionsPageContent>} */
  getSolutionsPage(language = 'vi') {
    return backendApiAdapter.getSolutionsPage(language)
  },
}
