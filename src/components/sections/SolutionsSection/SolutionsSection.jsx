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

const solutionGroups = [
   {
      id: 'business',
      titleKey: 'solutions.groups.business.title',
      descriptionKey: 'solutions.groups.business.description',
      image: 'https://tallemucrm.com/assets/img/live/2023/11/iStock-1049186550.jpg',
      modules: [
         {
            id: 'sales',
            titleKey: 'solutions.modules.sales',
            icon: ShoppingCart,
         },
         {
            id: 'crm',
            titleKey: 'solutions.modules.crm',
            icon: Users,
         },
      ],
      imagePosition: '72% center',
   },
   {
      id: 'supply-chain',
      titleKey: 'solutions.groups.supplyChain.title',
      descriptionKey: 'solutions.groups.supplyChain.description',
      image: 'https://www.airistaflow.com/wp-content/uploads/2024/10/AdobeStock_523184404-scaled.jpeg',
      modules: [
         {
            id: 'procurement',
            titleKey: 'solutions.modules.procurement',
            icon: PackageSearch,
         },
         {
            id: 'inventory',
            titleKey: 'solutions.modules.inventory',
            icon: Boxes,
         },
      ],
      imagePosition: '80% center',
   },
   {
      id: 'manufacturing',
      titleKey: 'solutions.groups.manufacturing.title',
      descriptionKey: 'solutions.groups.manufacturing.description',
      image: 'https://res.cloudinary.com/drslg1shx/image/upload/v1790051630/162_pdpznt.jpg',
      modules: [
         {
            id: 'production',
            titleKey: 'solutions.modules.production',
            icon: Factory,
         },
         {
            id: 'maintenance',
            titleKey: 'solutions.modules.maintenance',
            icon: Sparkles,
         },
      ],
      imagePosition: '85% center',
   },
   {
      id: 'management',
      titleKey: 'solutions.groups.management.title',
      descriptionKey: 'solutions.groups.management.description',
      image: 'https://res.cloudinary.com/drslg1shx/image/upload/v1790051140/train_qadw6j.png',
      modules: [
         {
            id: 'hr',
            titleKey: 'solutions.modules.hr',
            icon: BriefcaseBusiness,
         },
         {
            id: 'project',
            titleKey: 'solutions.modules.project',
            icon: LandPlot,
         },
         {
            id: 'finance',
            titleKey: 'solutions.modules.finance',
            icon: BarChart3,
         },
      ],
      imagePosition: '80% center',
   },
]

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

function SolutionModuleList({ modules, t }) {
   return (
      <div className="solution-module-list" role="list">
         {modules.map((module) => (
            <SolutionModuleLink
               key={module.id}
               title={t(module.titleKey)}
               icon={module.icon}
               href={module.href}
            />
         ))}
      </div>
   )
}

function SolutionPanel({ group, isActive, onSelect, prefersReducedMotion, t }) {
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
            onClick={() => onSelect(group.id)}
            aria-expanded={isActive}
            aria-controls={isActive ? `${group.id}-panel` : undefined}
            id={`${group.id}-trigger`}
         >
            <span className="solution-panel__title">{t(group.titleKey)}</span>
            <span className="solution-panel__icon" aria-hidden="true">
               <Plus size={25} strokeWidth={2} />
            </span>
         </button>
         </h3>

         {isActive && (
            <motion.div
               id={`${group.id}-panel`}
               className="solution-panel__content"
               initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
               animate={{ opacity: 1, x: 0 }}
               transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, delay: 0.08, ease: 'easeOut' }}
               aria-labelledby={`${group.id}-trigger`}
            >
               <p className="solution-panel__description">{t(group.descriptionKey)}</p>
               <SolutionModuleList modules={group.modules} t={t} />
            </motion.div>
         )}
      </motion.div>
   )
}

export function SolutionsSection() {
   const { t } = useTranslation()
   const [activeSolutionId, setActiveSolutionId] = useState('business')
   const prefersReducedMotion = useReducedMotion()

   const handleSelect = (id) => {
      setActiveSolutionId((current) => (current === id ? current : id))
   }

   return (
      <NeotekSection className="solutions-section" aria-labelledby="solutions-heading">
         <NeotekContainer className="solutions-container">
            <header className="solutions-header">
               <h2 id="solutions-heading" className="solutions-header__title">
                  {t('solutions.title')}
               </h2>
            </header>

            <div className="solutions-grid" role="list" aria-label={t('solutions.aria')}>
               {solutionGroups.map((group) => (
                  <SolutionPanel
                     key={group.id}
                     group={group}
                     isActive={group.id === activeSolutionId}
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
