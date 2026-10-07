import { createSkeletonItems } from '../../../utils/skeleton'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'

import './FAQSection.css'

function FAQIcon({ isOpen }) {
  return (
    <span
      className={`faq-item__icon ${isOpen ? 'is-open' : ''}`}
      aria-hidden="true"
    >
      <span className="faq-item__icon-line faq-item__icon-line--horizontal" />
      <span className="faq-item__icon-line faq-item__icon-line--vertical" />
    </span>
  )
}

function FAQItem({
  item,
  isOpen,
  onToggle,
  prefersReducedMotion,
  loading,
}) {
  const answerId = `faq-${item.id}-answer`
  const triggerId = `faq-${item.id}-trigger`

  return (
    <div className={`faq-item ${isOpen ? 'is-open' : ''}`}>
      <h3 className="faq-item__heading">
      <button
        type="button"
        className="faq-item__trigger"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={answerId}
        onClick={() => onToggle(item.id)}
        disabled={loading}
      >
        <span className="faq-item__question skeleton-target">
          {item.question}
        </span>

        <FAQIcon isOpen={isOpen} />
      </button>
      </h3>

      <motion.div
        id={answerId}
        className="faq-item__answer-wrap"
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!isOpen}
        initial={false}
        animate={
          isOpen
            ? { height: 'auto', opacity: 1 }
            : { height: 0, opacity: 0 }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                height: {
                  duration: 0.38,
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: {
                  duration: 0.22,
                  ease: 'easeOut',
                },
              }
        }
      >
        <div
          className="faq-item__answer"
          dangerouslySetInnerHTML={{
            __html: item.answerHtml,
          }}
        />
      </motion.div>
    </div>
  )
}

export function FAQSection({
  copy = {},
  faqs = [],
  loading = false,
  error = null,
}) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [openFaqId, setOpenFaqId] = useState(null)
  const visibleFaqs = loading ? createSkeletonItems(6, 'faq').map((item) => ({ ...item, question: '████████ ████████ ████████ ████████', answerHtml: '' })) : faqs

  useEffect(() => {
    setOpenFaqId(
      faqs.length > 0
        ? faqs[0].id
        : null,
    )
  }, [faqs])

  const handleToggle = (id) => {
    setOpenFaqId((current) => (
      current === id ? null : id
    ))
  }

  return (
    <NeotekSection
      className={`faq-section${loading ? ' is-loading' : ''}`}
      aria-busy={loading}
      aria-labelledby="faq-heading"
    >
      <NeotekContainer className="faq-container">
        <header className="faq-heading">
          <p className="faq-heading__eyebrow">
            {(copy.eyebrow || '')}
          </p>

          <h2
            id="faq-heading"
            className="faq-heading__title"
          >
            {(copy.title || '')}
          </h2>

          <p className="faq-heading__description">
            {(copy.description || '')}
          </p>

          <a
            href={copy.ctaUrl || undefined}
            className="faq-heading__cta"
          >
            {(copy.ctaLabel || '')}
            <span aria-hidden="true">→</span>
          </a>
        </header>

        <div className="faq-list" aria-hidden={loading || undefined} inert={loading ? '' : undefined}>

          {!loading && error ? (
            <p
              className="faq-section__status faq-section__status--error"
              role="alert"
            >
              {t('faq.loadError', {
                defaultValue: 'Không thể tải câu hỏi thường gặp.',
              })}
            </p>
          ) : null}

          {!loading && !error && faqs.length === 0 ? (
            <p className="faq-section__status">
              {t('faq.empty', {
                defaultValue: 'Hiện chưa có câu hỏi thường gặp.',
              })}
            </p>
          ) : null}

          {(loading || !error) && visibleFaqs.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={!loading && item.id === openFaqId}
              onToggle={handleToggle}
              prefersReducedMotion={loading || prefersReducedMotion}
              loading={loading}
            />
          ))}
        </div>
      </NeotekContainer>
    </NeotekSection>
  )
}