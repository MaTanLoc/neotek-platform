import { NeotekNavbar } from './components/layout/NeotekNavbar/NeotekNavbar'
import { NeotekFooter } from './components/layout/NeotekFooter/NeotekFooter'
import { HeroCarousel } from './components/home/HeroCarousel/HeroCarousel'
import { WhySection } from './components/sections/WhySection/WhySection'
import { SolutionsSection } from './components/sections/SolutionsSection/SolutionsSection'
import { ProofMetricsSection } from './components/sections/ProofMetricsSection/ProofMetricsSection'
import { TrustedBySection } from './components/sections/TrustedBySection/TrustedBySection'
import { TestimonialsSection } from './components/sections/TestimonialsSection/TestimonialsSection'
import { CTASection } from './components/sections/CTASection/CTASection'
import { FAQSection } from './components/sections/FAQSection/FAQSection'
import './components/common/neotek-components.css'
import './components/layout/neotek-layout.css'

export default function App() {
  return (
    <div className="neotek-site-shell">
      <NeotekNavbar />
      <main>
        <HeroCarousel />
        <WhySection />
        <SolutionsSection />
        <ProofMetricsSection />
        <TrustedBySection />
        <TestimonialsSection />
        <CTASection />
        <FAQSection />
      </main>
      <NeotekFooter />
    </div>
  )
}
