import { createSkeletonItems } from '../../../utils/skeleton'
import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  City01Icon,
  CircleGaugeIcon,
  UserGroup02Icon,
  WorkflowSquare10Icon,
} from '@hugeicons/core-free-icons'
import { useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'

import './ProofMetricsSection.css'

const metricIcons = {
  customers: UserGroup02Icon,
  efficiency: CircleGaugeIcon,
  modules: WorkflowSquare10Icon,
  industries: City01Icon,
}

const sectionActions = [
  {
    id: 'trial',
    labelKey: 'metrics.actions.trial',
    href: '/demo',
    variant: 'primary',
  },
  {
    id: 'pricing',
    labelKey: 'metrics.actions.pricing',
    href: null,
    variant: 'secondary',
  },
  {
    id: 'purchase',
    labelKey: 'metrics.actions.purchase',
    href: null,
    variant: 'ghost',
  },
]

function formatMetricValue(value, language) {
  return new Intl.NumberFormat(
    language === 'en' ? 'en-US' : 'vi-VN',
  ).format(value)
}

function useMetricCounter(targetValue, shouldAnimate, duration = 1200) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!shouldAnimate) return undefined

    if (targetValue === 0) {
      setDisplayValue(0)
      return undefined
    }

    let animationFrame
    const startTime = performance.now()

    const updateValue = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easedProgress = 1 - ((1 - progress) ** 3)

      setDisplayValue(Math.round(targetValue * easedProgress))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateValue)
      }
    }

    animationFrame = requestAnimationFrame(updateValue)

    return () => cancelAnimationFrame(animationFrame)
  }, [duration, shouldAnimate, targetValue])

  return displayValue
}

function MetricCard({ metric, hasAnimated, prefersReducedMotion, language, loading }) {
  const animatedValue = useMetricCounter(
    metric.value,
    !loading && hasAnimated && !prefersReducedMotion,
  )

  const visibleValue =
    prefersReducedMotion && hasAnimated
      ? metric.value
      : animatedValue

  const displayValue =
    loading ? '████' : `${formatMetricValue(visibleValue, language)}${metric.suffix}`

  const icon = metricIcons[metric.metricKey] ?? null

  return (
    <article className={`proof-metric-item ${loading || hasAnimated ? 'is-visible' : ''}`}>
      <div className="proof-metric-card__icon skeleton-target" aria-hidden="true">
        {icon ? (
          <HugeiconsIcon
            icon={icon}
            size={21}
            color="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ) : null}
      </div>

      <div className="proof-metric-item__content">
        <p
          className="proof-metric-card__value skeleton-target"
          aria-label={`${metric.title}: ${displayValue}`}
        >
          {displayValue}
        </p>

        <p className="proof-metric-card__title skeleton-target">
          {metric.title}
        </p>

        <p className="proof-metric-card__subtitle skeleton-target">
          {metric.subtitle}
        </p>
      </div>
    </article>
  )
}

export function ProofMetricsSection({
  metrics = [],
  loading = false,
  error = null,
}) {
  const { t, i18n } = useTranslation()
  const sectionRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const visibleMetrics = loading ? createSkeletonItems(4, 'metric').map((item) => ({ ...item, value: 0, suffix: '', title: '████████ ████████', subtitle: '████████ ████████ ████████' })) : metrics

  const language = i18n.language === 'en' ? 'en' : 'vi'

  useEffect(() => {
    const section = sectionRef.current

    if (
      !section ||
      hasAnimatedRef.current ||
      loading ||
      error ||
      metrics.length === 0
    ) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true
          setHasAnimated(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [loading, error, metrics.length])

  return (
    <NeotekSection
      ref={sectionRef}
      className={`proof-metrics-section${loading ? ' is-loading' : ''}`}
      aria-busy={loading}
      aria-label={t('metrics.title')}
    >
      <NeotekContainer className="proof-metrics-container">
        <div className="proof-metrics-row">
          <div className="proof-visual">
            <img
              src="https://res.cloudinary.com/drslg1shx/image/upload/v1790052447/proof_clg82j.webp"
              alt=""
              loading="lazy" decoding="async"
            />
          </div>

          <div className="proof-metrics-content">
            <div className="proof-metrics-intro">
              <h2 className="proof-metrics-intro__title">
                {t('metrics.title')}
              </h2>

              <p className="proof-metrics-intro__description">
                {t('metrics.description')}
              </p>
            </div>

            {(loading || !error) && visibleMetrics.length > 0 ? (
              <div
                className="proof-metrics-grid"
                aria-hidden={loading || undefined}
                inert={loading ? '' : undefined}
                role="list"
                aria-label={t('metrics.title')}
              >
                {visibleMetrics.map((metric) => (
                  <div key={metric.id} role="listitem">
                    <MetricCard
                      metric={metric}
                      loading={loading}
                      hasAnimated={hasAnimated}
                      prefersReducedMotion={prefersReducedMotion}
                      language={language}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </NeotekContainer>

      <div
        className="proof-metrics-actions"
        aria-label={t('metrics.title')}
      >
        {sectionActions.map((action) => (
          <NeotekButton
            key={action.id}
            href={action.href || undefined}
            variant={action.variant}
            className={`proof-metrics-action proof-metrics-action--${action.id}`}
            disabled={!action.href}
            aria-label={t(action.labelKey)}
          >
            {t(action.labelKey)}
            {action.id === 'purchase' ? ' →' : ''}
          </NeotekButton>
        ))}
      </div>
    </NeotekSection>
  )
}