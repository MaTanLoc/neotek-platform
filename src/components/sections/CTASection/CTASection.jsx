import { ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'

import './CTASection.css'

export function CtaView({
  cta = null,
  loading = false,
  error = null,
  variant = 'default',
  headingId = 'cta-heading',
  preview = false,
  primaryHref,
  secondaryHref,
  showSecondary = true,
}) {
  const prefersReducedMotion = useReducedMotion()
  const isSolutionsVariant = variant === 'solutions'

  if (!loading && (error || !cta)) {
    return null
  }

  const content = loading ? { eyebrow: '████████', title: '████████ ████████ ████████ ████████', description: '████████ ████████ ████████ ████████ ████████ ████████', primaryLabel: '████████ ████████', secondaryLabel: '████████ ████████' } : cta

  const actions = [
    {
      id: 'demo',
      label: content.primaryLabel,
      href: primaryHref ?? content.primaryUrl,
      variant: content.primaryVariant === 'secondary' ? 'outline' : content.primaryVariant || 'primary',
    },
    {
      id: 'platform',
      label: content.secondaryLabel,
      href: secondaryHref ?? content.secondaryUrl,
      variant: content.secondaryVariant === 'secondary' || !content.secondaryVariant ? 'outline' : content.secondaryVariant,
    },
  ].filter((action) => (
    action.id === 'demo' ? content.showPrimaryCta !== false : showSecondary && content.showSecondaryCta !== false
  ))

  return (
    <NeotekSection
      aria-busy={loading}
      className={`cta-section${loading ? ' is-loading' : ''}${
        isSolutionsVariant
          ? ' cta-section--solutions'
          : ''
      }`}
      aria-labelledby={headingId}
    >
      <NeotekContainer
        className={`cta-container${
          isSolutionsVariant
            ? ' cta-container--solutions'
            : ''
        }`}
      >
        <motion.div
          aria-hidden={loading || undefined}
          inert={loading ? '' : undefined}
          className={`cta-content${
            isSolutionsVariant
              ? ' cta-content--solutions'
              : ''
          }`}
          initial={
            preview || loading || prefersReducedMotion
              ? false
              : { opacity: 0, y: 16 }
          }
          animate={preview ? { opacity: 1, y: 0 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.45, ease: 'easeOut' }
          }
        >
          {content.eyebrow ? (
            <p className="cta-content__eyebrow skeleton-target">
              {content.eyebrow}
            </p>
          ) : null}

          {content.title ? (
            <h2
              id={headingId}
              className="cta-content__title skeleton-target"
            >
              {content.title}
            </h2>
          ) : null}

          {content.description ? (
            <p className="cta-content__description skeleton-target">
              {content.description}
            </p>
          ) : null}

          <div
            className="cta-actions"
            aria-label={content.title}
          >
            {actions.map((action) => (
              <NeotekButton
                key={action.id}
                href={loading ? undefined : action.href || undefined}
                variant={action.variant}
                disabled={loading || !action.href}
                className={`cta-action cta-action--${action.id} skeleton-target`}
              >
                {action.label}

                {action.id === 'demo' ? (
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                  />
                ) : null}
              </NeotekButton>
            ))}
          </div>
        </motion.div>
      </NeotekContainer>
    </NeotekSection>
  )
}
export function CTASection(props) { return <CtaView {...props} /> }
