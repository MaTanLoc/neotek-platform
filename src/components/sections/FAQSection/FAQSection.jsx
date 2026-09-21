import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'
import './FAQSection.css'

const faqItems = [
  { id: 'what-is-neoerp', questionKey: 'faq.items.whatIs', answerKey: 'faq.answers.whatIs' },
  { id: 'neoerp-modules', questionKey: 'faq.items.modules', answerKey: 'faq.answers.modules' },
  { id: 'system-integration', questionKey: 'faq.items.integration', answerKey: 'faq.answers.integration' },
  { id: 'multi-company-branch', questionKey: 'faq.items.multiCompany', answerKey: 'faq.answers.multiCompany' },
  { id: 'web-mobile-access', questionKey: 'faq.items.access', answerKey: 'faq.answers.access' },
  { id: 'shared-data', questionKey: 'faq.items.sharedData', answerKey: 'faq.answers.sharedData' },
  { id: 'budget-forecast', questionKey: 'faq.items.budget', answerKey: 'faq.answers.budget' },
  { id: 'consolidated-finance', questionKey: 'faq.items.finance', answerKey: 'faq.answers.finance' },
]

function FAQItem({ item, isOpen, onToggle, prefersReducedMotion, t }) {
  const answerId = `${item.id}-answer`
  const triggerId = `${item.id}-trigger`

  return (
    <div className={`faq-item ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="faq-item__trigger"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={answerId}
        onClick={() => onToggle(item.id)}
      >
        <span>{t(item.questionKey)}</span>
        {isOpen ? <Minus className="faq-item__icon" size={20} aria-hidden="true" /> : <Plus className="faq-item__icon" size={20} aria-hidden="true" />}
      </button>
      <motion.div
        id={answerId}
        className="faq-item__answer-wrap"
        role="region"
        aria-labelledby={triggerId}
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
        aria-hidden={!isOpen}
      >
        <p className="faq-item__answer">{t(item.answerKey)}</p>
      </motion.div>
    </div>
  )
}

export function FAQSection() {
  const { t } = useTranslation()
  const [openFaqId, setOpenFaqId] = useState(faqItems[0].id)
  const prefersReducedMotion = useReducedMotion()

  const handleToggle = (id) => {
    setOpenFaqId((current) => (current === id ? null : id))
  }

  return (
    <NeotekSection className="faq-section" aria-labelledby="faq-heading">
      <NeotekContainer className="faq-container">
        <header className="faq-heading">
          <p className="faq-heading__eyebrow">{t('faq.eyebrow')}</p>
          <h2 id="faq-heading" className="faq-heading__title">{t('faq.title')}</h2>
        </header>
        <div className="faq-list">
          {faqItems.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={item.id === openFaqId}
              onToggle={handleToggle}
              prefersReducedMotion={prefersReducedMotion}
              t={t}
            />
          ))}
        </div>
      </NeotekContainer>
    </NeotekSection>
  )
}
