import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { ChevronRight } from 'lucide-react'
import {
  Briefcase04Icon,
  Blockchain04Icon,
  Settings01Icon,
  FolderManagementIcon,
} from '@hugeicons/core-free-icons'
import { NeotekNavbar } from '../../components/layout/NeotekNavbar/NeotekNavbar'
import { NeotekFooter } from '../../components/layout/NeotekFooter/NeotekFooter'
import { NeotekContainer } from '../../components/common/NeotekContainer/NeotekContainer'
import { NeotekButton } from '../../components/common/NeotekButton/NeotekButton'
import { TrustedBySection } from '../../components/sections/TrustedBySection/TrustedBySection'
import { CTASection } from '../../components/sections/CTASection/CTASection'
import { FAQSection } from '../../components/sections/FAQSection/FAQSection'
import { getLocalizedPath } from '../../i18n'
import './SolutionsPage.css'
import { contentService } from '../../services/content/contentService'

const EMPTY_SOLUTIONS_DATA = { hero: [], solutionGroups: [], solutionModules: {}, trustedLogos: [], ctaSection: null, faqs: [] }
const GROUP_ICONS = {
  business: Briefcase04Icon,
  supplyChain: Blockchain04Icon,
  operations: Settings01Icon,
  management: FolderManagementIcon,
}

function ModuleIcon({ name, size = 20 }) {
  return (
    <img
      src={`/assets/SolutionPageIcon/${name}`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  )
}

function ModuleAccordion({ group, modules, prefersReducedMotion, activeModule, onToggleModule }) {
  return (
    <div className="solutions-accordion" aria-label="Modules in this solution group">
      {group.modules.map((moduleId) => {
        const module = modules[moduleId] || {}
        const isOpen = activeModule === moduleId
        const triggerId = `solutions-${group.id}-${moduleId}-trigger`
        const panelId = `solutions-${group.id}-${moduleId}-panel`
        return (
          <div className={`solutions-accordion__item${isOpen ? ' is-open' : ''}`} key={moduleId}>
            <h4 className="solutions-accordion__heading">
              <button
                className="solutions-accordion__trigger"
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => onToggleModule(moduleId)}
              >
                <span className="solutions-accordion__module-icon" aria-hidden="true">
                  <ModuleIcon name={module.icon} size={20} />
                </span>
                <span className="solutions-accordion__module-name">{module.title || moduleId}</span>
                <span
                  className={`solutions-accordion__toggle${isOpen ? ' is-open' : ''}`}
                  aria-hidden="true"
                >
                  <span className="solutions-accordion__toggle-line solutions-accordion__toggle-line--horizontal" />
                  <span className="solutions-accordion__toggle-line solutions-accordion__toggle-line--vertical" />
                </span>
              </button>
            </h4>
            <motion.div
              className="solutions-accordion__panel-wrap"
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
              initial={false}
              animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="solutions-accordion__panel">
                <p className="solutions-accordion__description">{module.description}</p>
                <ul>
                  {module.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

function SolutionCluster({ group, modules, index, prefersReducedMotion }) {
  // Open the first module on initial render so the visual always has a clear context.
  const [activeModule, setActiveModule] = useState(group.modules[0])
  const [visualModule, setVisualModule] = useState(group.modules[0])
  const reverse = index % 2 === 1
  const selectedModule = visualModule || group.modules[0]
  const selectedDetails = modules[selectedModule] || {}
  const selectedLabel = selectedDetails.title || selectedModule

  const toggleModule = (moduleId) => {
    // Keep one module open at all times: clicking the current module is a no-op.
    if (moduleId === activeModule) return

    setActiveModule(moduleId)
    setVisualModule(moduleId)
  }

  return (
    <motion.article
      className={`solutions-cluster${reverse ? ' solutions-cluster--reverse' : ''}`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 58, scale: 0.94, rotateX: 2.5, filter: 'blur(6px)' }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.22, margin: '0px 0px -8% 0px' }}
      transition={prefersReducedMotion ? { duration: 0 } : {
        duration: 0.72,
        delay: Math.min(index * 0.08, 0.24),
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="solutions-cluster__copy">
        <div className="solutions-cluster__label">
          <span className="solutions-cluster__icon" aria-hidden="true">
            <HugeiconsIcon icon={group.icon} size={20} strokeWidth={1.6} />
          </span>
          <span>{group.eyebrow}</span>
        </div>
        <h3>{group.title}</h3>
        <p className="solutions-cluster__description">
          {group.description}
        </p>
        <ModuleAccordion
          group={group}
          modules={modules}
          prefersReducedMotion={prefersReducedMotion}
          activeModule={activeModule}
          onToggleModule={toggleModule}
        />
      </div>
      <div
        className="solutions-cluster__visual-frame"
        role="img"
        aria-label={`${group.visualLabel || group.title} — ${selectedLabel}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedModule}
            className={`solutions-cluster__visual-image${selectedDetails.visualSrc ? ' has-image' : ' is-placeholder'}`}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 1.025, y: -4 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {selectedDetails.visualSrc ? (
              <img src={selectedDetails.visualSrc} alt={selectedLabel} loading="lazy" decoding="async" />
            ) : (
              <div className="solutions-visual-fallback" aria-hidden="true">
                <span className="solutions-visual-fallback__icon"><ModuleIcon name={selectedDetails.icon} size={34} /></span>
                <span className="solutions-visual-fallback__label">{selectedLabel}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.article>
  )
}

export default function SolutionsPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'en' ? 'en' : 'vi'
  const [cmsData, setCmsData] = useState(EMPTY_SOLUTIONS_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        setError(null)
        const data = await contentService.getSolutionsPage(language)
        if (!active) return
        setCmsData(data)
        hasLoadedOnce.current = true
      } catch (err) {
        if (!active) return
        console.error('Failed to load solutions page data:', err)
        if (!hasLoadedOnce.current) setError(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [language])
  const prefersReducedMotion = useReducedMotion()
  const registerPath = getLocalizedPath('/register', i18n.language)
  const hero = cmsData.hero[0] || {}
  const groups = cmsData.solutionGroups.map(group => ({ ...group, id: group.key, icon: GROUP_ICONS[group.key] })).filter(group => group.icon)

  return (
    <div className="neotek-site-shell solutions-page">
      <NeotekNavbar heroSelector=".solutions-hero" heroLogoSrc="/assets/logo/logo_306x98.png" />

      <main>
        <section className="solutions-hero" aria-labelledby="solutions-hero-title">
          <NeotekContainer className="solutions-hero__inner">
            <div className="solutions-hero__copy">
              <p className="neotek-eyebrow">{hero.eyebrow}</p>
              <h1 id="solutions-hero-title" className="solutions-hero__title">
                <span className="solutions-hero__title-line">
                  {hero.titleLine1 || hero.headline}
                </span>

                <span className="solutions-hero__title-line solutions-hero__title-line--highlight">
                  {hero.titleHighlight}
                </span>
              </h1>
              <p className="neotek-lead">{hero.description}</p>
              <div className="solutions-hero__actions">
                <NeotekButton
                  href="#solution-clusters"
                  className="solutions-hero__button solutions-hero__button--primary"
                >
                  {hero.primaryLabel}
                </NeotekButton>

                <a className="solutions-hero__link" href={registerPath}>
                  {hero.secondaryLabel}
                  <ChevronRight size={14} aria-hidden="true" />
                </a>
              </div>
            </div>
            <div
              className="solutions-hero__visual"
              role="img"
              aria-label={hero.visualLabel || hero.headline}
            >
              <div className="solutions-hero__visual-surface">
                <img
                  className="solutions-hero__dashboard"
                  src={hero.image || undefined}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </NeotekContainer>
        </section>

        <TrustedBySection logos={cmsData.trustedLogos} loading={loading} error={error} />

        <section id="solution-clusters" className="solutions-clusters" aria-labelledby="solutions-clusters-title">
          <NeotekContainer>
            <header className="solutions-clusters__intro">
              <p className="neotek-eyebrow">{t('solutionsPage.intro.eyebrow')}</p>
              <h2 id="solutions-clusters-title">
                {t('solutionsPage.intro.titleLine1')} <span>{t('solutionsPage.intro.titleHighlight')}</span>
              </h2>
              <p>{t('solutionsPage.intro.description')}</p>
            </header>
            <div className="solutions-clusters__list">
              {groups.map((group, index) => (
                <SolutionCluster
                  key={group.id}
                  group={group}
                  index={index}
                  modules={cmsData.solutionModules}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </NeotekContainer>
        </section>

        <CTASection cta={cmsData.ctaSection} loading={loading} error={error} />
        <FAQSection faqs={cmsData.faqs} loading={loading} error={error} />
      </main>

      <NeotekFooter demoHref={registerPath} showCta={false} />
    </div>
  )
}
