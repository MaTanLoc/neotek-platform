export const SECTION_METADATA = {
  hero: { label: 'Hero Banner', description: 'Main headline, description, images and primary actions.' },
  why: { label: 'Why Neotek', description: 'Reasons and benefits presented to visitors.' },
  solutionOverview: { label: 'Solution Overview', description: 'A high-level overview of the platform.' },
  proofMetrics: { label: 'Proof Metrics', description: 'Key numbers and business proof points.' },
  trustedLogos: { label: 'Trusted Logos', description: 'Customer and partner logos.' },
  solutionClusters: { label: 'Solution Clusters', description: 'Groups of related solutions.' },
  testimonials: { label: 'Testimonials', description: 'Customer quotes and people information.' },
  cta: { label: 'Call to Action', description: 'A closing message and action buttons.' },
  faq: { label: 'Frequently Asked Questions', description: 'Questions and answers displayed near the bottom of the page.' },
  solutionGroups: { label: 'Solution Groups', description: 'Solution categories and their descriptions.' },
  solutionModules: { label: 'Solution Modules', description: 'Modules available in each solution.' },
}

export function getSectionMetadata(type) {
  return SECTION_METADATA[type] || { label: type, description: 'Content section on this page.' }
}

export function getLocaleLabel(locale) {
  return locale === 'vi' ? 'Vietnamese' : locale === 'en' ? 'English' : locale
}
