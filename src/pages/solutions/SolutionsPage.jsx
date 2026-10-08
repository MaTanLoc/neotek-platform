import { SolutionsHeroView } from './SolutionsHeroView'
import { useEffect, useRef, useState } from 'react'
import NotFoundPage from '../not-found/NotFoundPage'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { Briefcase04Icon } from '@hugeicons/core-free-icons'
import { GROUP_ICONS, moduleIconSource, moduleDetailPath } from './solutionPresentation'
import { NeotekNavbar } from '../../components/layout/NeotekNavbar/NeotekNavbar'
import { NeotekFooter } from '../../components/layout/NeotekFooter/NeotekFooter'
import { NeotekContainer } from '../../components/common/NeotekContainer/NeotekContainer'
import { TrustedBySection } from '../../components/sections/TrustedBySection/TrustedBySection'
import { CTASection } from '../../components/sections/CTASection/CTASection'
import { FAQSection } from '../../components/sections/FAQSection/FAQSection'
import { getLocalizedPath } from '../../i18n'
import './SolutionsPage.css'
import { contentService } from '../../services/content/contentService'

const EMPTY_SOLUTIONS_DATA = { hero: [], solutionGroups: [], solutionModules: {}, trustedLogos: [], ctaSection: null, faqs: [] }

function ModuleIcon({ name, size = 20 }) {
  if (!name) return null
  return (
    <img
      src={moduleIconSource(name)}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  )
}

function ModuleAccordion({ group, modules, prefersReducedMotion, activeModule, onToggleModule, language }) {
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
                  {(module.bullets || []).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                {moduleDetailPath(module.slug, language, module.detailAvailable) ? <a className="solutions-module-cta" href={moduleDetailPath(module.slug, language, module.detailAvailable)}>{module.ctaLabel || (language === 'en' ? 'View details' : 'Xem chi ti\u1ebft')}</a> : <button className="solutions-module-cta" type="button" disabled title={language === 'en' ? 'Module detail page is not available yet' : 'Ch\u01b0a c\u00f3 trang chi ti\u1ebft ph\u00e2n h\u1ec7'}>{module.ctaLabel || (language === 'en' ? 'View details' : 'Xem chi ti\u1ebft')}</button>}
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

export function SolutionCluster({ group, modules, index = 0, prefersReducedMotion, language = 'vi' }) {
  // Open the first module on initial render so the visual always has a clear context.
  const [activeModule, setActiveModule] = useState(group.modules[0])
  const [visualModule, setVisualModule] = useState(group.modules[0])
  const reverse = index % 2 === 1
  const selectedModule = visualModule || group.modules[0]
  const moduleDetails = modules[selectedModule] || {}
  const selectedDetails = { ...moduleDetails, visualSrc: moduleDetails.visualSrc || group.visualSrc }
  const selectedLabel = selectedDetails.title || selectedModule || group.title

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
          language={language}
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
  const { i18n } = useTranslation()
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
        if (err.status === 404 || !hasLoadedOnce.current) setError(err)
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
  const groups = cmsData.solutionGroups.map(group => ({ ...group, id: group.key, icon: GROUP_ICONS[group.icon] || GROUP_ICONS[group.key] || Briefcase04Icon }))

  if (error?.status === 404) return <NotFoundPage />

  return (
    <div className="neotek-site-shell solutions-page">
      <NeotekNavbar heroSelector=".solutions-hero" heroLogoSrc="/assets/logo/logo_306x98.png" />

      <main>
        <SolutionsHeroView hero={hero} language={language} />

        <TrustedBySection copy={cmsData.sectionCopy?.trustedBy} logos={cmsData.trustedLogos} loading={loading} error={error} />

        <section id="solution-clusters" className="solutions-clusters" aria-labelledby="solutions-clusters-title">
          <NeotekContainer>
            <header className="solutions-clusters__intro">
              <p className="neotek-eyebrow">{cmsData.sectionCopy?.groups?.eyebrow}</p>
              <h2 id="solutions-clusters-title">
                {cmsData.sectionCopy?.groups?.title} <span>{cmsData.sectionCopy?.groups?.titleHighlight}</span>
              </h2>
              <p>{cmsData.sectionCopy?.groups?.description}</p>
            </header>
            <div className="solutions-clusters__list">
              {groups.map((group, index) => (
                <SolutionCluster
                  key={group.id}
                  group={group}
                  index={index}
                  modules={cmsData.solutionModules}
                  language={language}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </NeotekContainer>
        </section>

        <CTASection cta={cmsData.ctaSection} loading={loading} error={error} />
        <FAQSection copy={cmsData.sectionCopy?.faq} faqs={cmsData.faqs} loading={loading} error={error} />
      </main>

      <NeotekFooter demoHref={registerPath} showCta={false} />
    </div>
  )
}
