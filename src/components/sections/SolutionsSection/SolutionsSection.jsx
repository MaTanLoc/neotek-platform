import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
   ArrowRight,
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
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'
import './SolutionsSection.css'

const solutionGroups = [
   {
      id: 'business',
      title: 'Kinh doanh',
      description: 'Xây dựng quy trình bán hàng, chăm sóc khách hàng và theo dõi cơ hội kinh doanh từ đầu đến cuối.',
      image: 'https://www.vietnamworks.com/hrinsider/wp-content/uploads/2024/07/salesman-la-gi.png',
      modules: [
         {
            id: 'sales',
            title: 'Bán hàng',
            icon: ShoppingCart,
         },
         {
            id: 'crm',
            title: 'CRM',
            icon: Users,
         },
      ],
   },
   {
      id: 'supply-chain',
      title: 'Chuỗi cung ứng',
      description: 'Kết nối mua hàng, tồn kho, vận chuyển và luồng hàng hóa trên cùng một nền tảng quản lý.',
      image: 'https://www.vietnamworks.com/hrinsider/wp-content/uploads/2024/07/salesman-la-gi.png',
      modules: [
         {
            id: 'procurement',
            title: 'Mua hàng',
            icon: PackageSearch,
         },
         {
            id: 'inventory',
            title: 'Kho vận',
            icon: Boxes,
         },
      ],
   },
   {
      id: 'manufacturing',
      title: 'Sản xuất',
      description: 'Lập kế hoạch, kiểm soát nguyên liệu, quy trình sản xuất và chi phí theo từng công đoạn.',
      image: 'https://www.vietnamworks.com/hrinsider/wp-content/uploads/2024/07/salesman-la-gi.png',
      modules: [
         {
            id: 'production',
            title: 'Sản xuất',
            icon: Factory,
         },
         {
            id: 'maintenance',
            title: 'Bảo trì',
            icon: Sparkles,
         },
      ],
   },
   {
      id: 'management',
      title: 'Quản trị',
      description: 'Kết nối nhân sự, dự án, tài chính và thông tin quản trị để hỗ trợ ra quyết định toàn doanh nghiệp.',
      image: 'https://www.vietnamworks.com/hrinsider/wp-content/uploads/2024/07/salesman-la-gi.png',
      modules: [
         {
            id: 'hr',
            title: 'Nhân sự',
            icon: BriefcaseBusiness,
         },
         {
            id: 'project',
            title: 'Dự án',
            icon: LandPlot,
         },
         {
            id: 'finance',
            title: 'Tài chính',
            icon: BarChart3,
         },
      ],
   },
]

function SolutionModuleLink({ title, icon: Icon, href }) {
   const content = (
      <>
         <span className="solution-module-link__label">
            <Icon size={16} aria-hidden="true" />
            <span>{title}</span>
            <ArrowRight size={18} aria-hidden="true" />
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
               key={module.id}
               title={module.title}
               icon={module.icon}
               href={module.href}
            />
         ))}
      </div>
   )
}

function SolutionPanel({ group, isActive, onSelect, prefersReducedMotion }) {
   return (
      <motion.div
         className={`solution-panel ${isActive ? 'is-active' : 'is-inactive'}`}
         style={{ '--solution-image': `url(${group.image})` }}
         layout={false}
         role="listitem"
         transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
      >
         <div className="solution-panel__background" aria-hidden="true" />
         <div className="solution-panel__base-overlay" aria-hidden="true" />
         <div className="solution-panel__active-overlay" aria-hidden="true" />

         <button
            type="button"
            className="solution-panel__trigger"
            onClick={() => onSelect(group.id)}
            aria-expanded={isActive}
            aria-controls={isActive ? `${group.id}-panel` : undefined}
            id={`${group.id}-trigger`}
         >
            <span className="solution-panel__title">{group.title}</span>
            <span className="solution-panel__icon" aria-hidden="true">
               <Plus size={25} strokeWidth={2} />
            </span>
         </button>

         {isActive && (
            <motion.div
               id={`${group.id}-panel`}
               className="solution-panel__content"
               initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
               animate={{ opacity: 1, x: 0 }}
               transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, delay: 0.08, ease: 'easeOut' }}
               aria-labelledby={`${group.id}-trigger`}
            >
               <p className="solution-panel__description">{group.description}</p>
               <SolutionModuleList modules={group.modules} />
            </motion.div>
         )}
      </motion.div>
   )
}

export function SolutionsSection() {
   const [activeSolutionId, setActiveSolutionId] = useState('supply-chain')
   const prefersReducedMotion = useReducedMotion()

   const handleSelect = (id) => {
      setActiveSolutionId((current) => (current === id ? current : id))
   }

   return (
      <NeotekSection className="solutions-section" aria-labelledby="solutions-heading">
         <NeotekContainer className="solutions-container">
            <header className="solutions-header">
               <h2 id="solutions-heading" className="solutions-header__title">
                  Giải pháp quản trị toàn diện cho doanh nghiệp
               </h2>
            </header>

            <div className="solutions-grid" role="list" aria-label="Các nhóm giải pháp">
               {solutionGroups.map((group) => (
                  <SolutionPanel
                     key={group.id}
                     group={group}
                     isActive={group.id === activeSolutionId}
                     onSelect={handleSelect}
                     prefersReducedMotion={prefersReducedMotion}
                  />
               ))}
            </div>
         </NeotekContainer>
      </NeotekSection>
   )
}
