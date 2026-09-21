import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'
import './CTASection.css'

const ctaActions = [
  { id: 'demo', labelKey: 'cta.demo', href: '/demo', variant: 'primary' },
  { id: 'platform', labelKey: 'cta.platform', href: '/solutions', variant: 'outline' },
]

export function CTASection() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <NeotekSection className="cta-section" aria-labelledby="cta-heading">
      <NeotekContainer className="cta-container">
        <motion.div
          className="cta-content"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.45, ease: 'easeOut' }
          }
        >
          <p className="cta-content__eyebrow">
            {t('cta.eyebrow')}
          </p>

          <h2 id="cta-heading" className="cta-content__title">
            <span>{t('cta.titleLine1')}</span>
            <span>{t('cta.titleLine2')}</span>
          </h2>

          <p className="cta-content__description">
            <span>
              {t('cta.descriptionLine1')}
            </span>{' '}
            <span>{t('cta.descriptionLine2')}</span>
          </p>

          <div className="cta-actions" aria-label={t('cta.title')}>
            {ctaActions.map((action) => (
              <NeotekButton
                key={action.id}
                href={action.href || undefined}
                variant={action.variant}
                disabled={!action.href}
                className={`cta-action cta-action--${action.id}`}
              >
                {t(action.labelKey)}
                {action.id === 'demo' ? (
                  <ArrowRight size={16} aria-hidden="true" />
                ) : null}
              </NeotekButton>
            ))}
          </div>
        </motion.div>
      </NeotekContainer>
    </NeotekSection>
  )
}