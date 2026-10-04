import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { NeotekNavbar } from '../../components/layout/NeotekNavbar/NeotekNavbar'
import { NeotekFooter } from '../../components/layout/NeotekFooter/NeotekFooter'

import { HeroCarousel } from '../../components/home/HeroCarousel/HeroCarousel'
import { WhySection } from '../../components/sections/WhySection/WhySection'
import { SolutionsSection } from '../../components/sections/SolutionsSection/SolutionsSection'
import { SolutionClustersSection } from '../../components/sections/SolutionClustersSection/SolutionClustersSection'
import { ProofMetricsSection } from '../../components/sections/ProofMetricsSection/ProofMetricsSection'
import { TrustedBySection } from '../../components/sections/TrustedBySection/TrustedBySection'
import { TestimonialsSection } from '../../components/sections/TestimonialsSection/TestimonialsSection'
import { CTASection } from '../../components/sections/CTASection/CTASection'
import { FAQSection } from '../../components/sections/FAQSection/FAQSection'

import { contentService } from '../../services/content/contentService'

const EMPTY_HOMEPAGE_DATA = {
   heroSlides: [],
   whyItems: [],
   solutionClusters: [],
   proofMetrics: [],
   trustedLogos: [],
   testimonials: [],
   ctaSection: null,
   faqs: [],
}

export default function HomePage() {
   const { i18n } = useTranslation()
   const language = i18n.language === 'en' ? 'en' : 'vi'

   const [homepageData, setHomepageData] = useState(() => contentService.getCachedHomePage(language) ?? EMPTY_HOMEPAGE_DATA)
   const [loading, setLoading] = useState(() => !contentService.getCachedHomePage(language))
   const [error, setError] = useState(null)

   const hasLoadedOnce = useRef(homepageData !== EMPTY_HOMEPAGE_DATA)

   useEffect(() => {
      let active = true

      async function loadHomepage() {
         try {
            if (!hasLoadedOnce.current) {
               setLoading(true)
            }

            setError(null)

            const data = await contentService.getHomePage(language)

            if (!active) return

            setHomepageData(data)
            hasLoadedOnce.current = true
         } catch (err) {
            if (!active) return

            console.error('Failed to load homepage data:', err)
            if (!hasLoadedOnce.current) setError(err)
         } finally {
            if (active) {
               setLoading(false)
            }
         }
      }

      loadHomepage()

      return () => {
         active = false
      }
   }, [language])

   return (
      <div className="neotek-site-shell">
         {createPortal(<NeotekNavbar />, document.body)}

         <main>
            <HeroCarousel
               slides={homepageData.heroSlides}
               loading={loading}
               error={error}
            />

            <WhySection
               items={homepageData.whyItems}
               loading={loading}
               error={error}
            />

            <SolutionsSection />

            <ProofMetricsSection
               metrics={homepageData.proofMetrics}
               loading={loading}
               error={error}
            />

            <TrustedBySection
               logos={homepageData.trustedLogos}
               loading={loading}
               error={error}
            />

            <SolutionClustersSection
               clusters={homepageData.solutionClusters}
               loading={loading}
               error={error}
            />

            <TestimonialsSection
               testimonials={homepageData.testimonials}
               loading={loading}
               error={error}
            />

            <CTASection
               cta={homepageData.ctaSection}
               loading={loading}
               error={error}
            />

            <FAQSection
               faqs={homepageData.faqs}
               loading={loading}
               error={error}
            />
         </main>

         <NeotekFooter />
      </div>
   )
}
