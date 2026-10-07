import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
   ChevronRight,
   BarChart3,
   Boxes,
   BriefcaseBusiness,
   Factory,
   LandPlot,
   PackageSearch,
   Plus,
   ShoppingCart,
   Sparkles,
   Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'
import './SolutionsSection.css'

const moduleIcons = { BarChart3, Boxes, BriefcaseBusiness, Factory, LandPlot, PackageSearch, ShoppingCart, Sparkles, Users }

function SolutionModuleLink({ title, icon: Icon, href }) {
   const content = (
      <>
         <span className="solution-module-link__label">
            <Icon size={16} aria-hidden="true" />
            <span>{title}</span>
            <ChevronRight size={18} aria-hidden="true" />
         </span>
      </>
   )

   if (href) {
      return (
         <div className="solution-module-link" role="listitem">
            <a className="solution-module-link__anchor" href={href}>
               {content}
            </a>
         </div>
      )
   }

   return <div className="solution-module-link" role="listitem">{content}</div>
}

function SolutionModuleList({ modules }) {
   return (
      <div className="solution-module-list" role="list">
         {modules.map((module) => (
            <SolutionModuleLink
               key={module.key}
               title={module.title}
               icon={moduleIcons[module.icon] || Boxes}
               href={module.url}
            />
         ))}
      </div>
   )
}

function SolutionPanel({ group, isActive, onSelect, prefersReducedMotion }) {
   return (
      <motion.div
         className={`solution-panel ${isActive ? 'is-active' : 'is-inactive'}`}
         style={{
            '--solution-image': `url(${group.image})`,
            '--solution-image-position': group.imagePosition,
         }}
         layout={false}
         role="listitem"
         transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
      >
         <div className="solution-panel__background" aria-hidden="true" />
         <div className="solution-panel__base-overlay" aria-hidden="true" />
         <div className="solution-panel__active-overlay" aria-hidden="true" />

         <h3 className="solution-panel__heading">
         <button
            type="button"
            className="solution-panel__trigger"
            onClick={() => onSelect(group.key)}
            aria-expanded={isActive}
            aria-controls={isActive ? `${group.key}-panel` : undefined}
            id={`${group.key}-trigger`}
         >
            <span className="solution-panel__title">{group.title}</span>
            <span className="solution-panel__icon" aria-hidden="true">
               <Plus size={25} strokeWidth={2} />
            </span>
         </button>
         </h3>

         {isActive && (
            <motion.div
               id={`${group.key}-panel`}
               className="solution-panel__content"
               initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
               animate={{ opacity: 1, x: 0 }}
               transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, delay: 0.08, ease: 'easeOut' }}
               aria-labelledby={`${group.key}-trigger`}
            >
               <p className="solution-panel__description">{group.description}</p>
               <SolutionModuleList modules={group.modules || []} />
            </motion.div>
         )}
      </motion.div>
   )
}

export function SolutionsSection({ content, loading }) {
   const { t } = useTranslation()
   const [activeSolutionId, setActiveSolutionId] = useState(null)
   const prefersReducedMotion = useReducedMotion()
   const solutionGroups = content?.items || []
   if (!loading && !solutionGroups.length) return null

   const handleSelect = (id) => {
      setActiveSolutionId((current) => (current === id ? current : id))
   }

   return (
      <NeotekSection className="solutions-section" aria-labelledby="solutions-heading">
         <NeotekContainer className="solutions-container">
            <header className="solutions-header">
               <h2 id="solutions-heading" className="solutions-header__title">
                  {content?.title || ''}
               </h2>
            </header>

            <div className="solutions-grid" role="list" aria-label={t('solutions.aria')}>
               {solutionGroups.map((group) => (
                  <SolutionPanel
                     key={group.key}
                     group={group}
                     isActive={group.key === (activeSolutionId || solutionGroups[0]?.key)}
                     onSelect={handleSelect}
                     prefersReducedMotion={prefersReducedMotion}
                     t={t}
                  />
               ))}
            </div>
         </NeotekContainer>
      </NeotekSection>
   )
}
