import { useEffect, useRef, useState } from 'react'
import { BarChart3, Building2, GitBranch, Users } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'
import './ProofMetricsSection.css'

const proofMetrics = [
  { id: 'articles', value: 4000, suffix: '+', label: 'Bài viết', status: 'PLACEHOLDER', icon: Building2 },
  { id: 'ebook', value: 360, suffix: '+', label: 'Ebook & Template', status: 'PLACEHOLDER', icon: Users },
  { id: 'webinar', value: 100, suffix: '+', label: 'Video & Webinar', status: 'PLACEHOLDER', icon: GitBranch },
  { id: 'courses', value: 100, suffix: '+', label: 'Khóa học', status: 'PLACEHOLDER', icon: BarChart3 },
]

const sectionActions = [
  { id: 'trial', label: 'Dùng thử miễn phí', href: '/demo', variant: 'primary', status: 'APPROVED_ROUTE' },
  { id: 'pricing', label: 'Báo giá', href: null, variant: 'secondary', status: 'TODO_ROUTE' },
  { id: 'purchase', label: 'Mua ngay', href: null, variant: 'ghost', status: 'TODO_ROUTE' },
]

function formatMetricValue(value) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function useMetricCounter(targetValue, shouldAnimate, duration = 1200) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!shouldAnimate) {
      return undefined
    }

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

function MetricCard({ metric, hasAnimated, prefersReducedMotion }) {
  const Icon = metric.icon
  const animatedValue = useMetricCounter(metric.value, hasAnimated && !prefersReducedMotion)
  const visibleValue = prefersReducedMotion && hasAnimated ? metric.value : animatedValue
  const displayValue = `${formatMetricValue(visibleValue)}${metric.suffix}`

  return (
    <article className={`proof-metric-item ${hasAnimated ? 'is-visible' : ''}`} data-status={metric.status}>
      <div className="proof-metric-card__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.7} />
      </div>
      <div className="proof-metric-item__content">
        <p className="proof-metric-card__value" aria-label={`${metric.label}: ${displayValue}`}>
          {displayValue}
        </p>
        <p className="proof-metric-card__label">{metric.label}</p>
      </div>
    </article>
  )
}

export function ProofMetricsSection() {
  const sectionRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const section = sectionRef.current
    if (!section || hasAnimatedRef.current) {
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimatedRef.current) {
        hasAnimatedRef.current = true
        setHasAnimated(true)
        observer.disconnect()
      }
    }, { threshold: 0.25 })

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <NeotekSection ref={sectionRef} className="proof-metrics-section" aria-label="Minh chứng nền tảng NeoERP">
      <NeotekContainer className="proof-metrics-container">
        <div className="proof-metrics-row">
          <div className="proof-visual-reserved" aria-hidden="true" />
          <div className="proof-metrics-content">
            <div className="proof-metrics-intro">
              <h2 className="proof-metrics-intro__title">Những con số đáng chú ý</h2>
              <p className="proof-metrics-intro__description">
                Những con số tiêu biểu giúp hình dung quy mô và hệ sinh thái nội dung, giải pháp mà NeoTek đang xây dựng.
              </p>
            </div>
            <div className="proof-metrics-grid" role="list" aria-label="Các chỉ số nền tảng">
              {proofMetrics.map((metric) => (
                <div key={metric.id} role="listitem">
                  <MetricCard metric={metric} hasAnimated={hasAnimated} prefersReducedMotion={prefersReducedMotion} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="proof-metrics-actions" aria-label="Hành động">
          {sectionActions.map((action) => (
            <NeotekButton
              key={action.id}
              href={action.href || undefined}
              variant={action.variant}
              className={`proof-metrics-action proof-metrics-action--${action.id}`}
              disabled={!action.href}
              aria-label={`${action.label}${action.status === 'TODO_ROUTE' ? ' - đang cập nhật' : ''}`}
            >
              {action.label}{action.id === 'purchase' ? ' →' : ''}
            </NeotekButton>
          ))}
        </div>
      </NeotekContainer>
    </NeotekSection>
  )
}
