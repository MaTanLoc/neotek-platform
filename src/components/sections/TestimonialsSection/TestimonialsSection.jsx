import { createSkeletonItems } from '../../../utils/skeleton'
import { Quote } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'

import './TestimonialsSection.css'

function getPersonInitial(name) {
  if (!name) return 'N'
  return name.trim().charAt(0).toUpperCase()
}

export function TestimonialCard({ testimonial, loading }) {
  const hasContent = Boolean(testimonial.quote)

  return (
    <article className="testimonial-card">
      <div className="testimonial-card__top">
        {testimonial.logo ? (
          <img
            className="testimonial-card__logo"
            src={testimonial.logo}
            alt=""
            loading="lazy" decoding="async"
          />
        ) : (
          <span className={loading ? 'testimonial-card__logo skeleton-target' : undefined} />
        )}

        <div
          className="testimonial-card__quote-mark skeleton-target"
          aria-hidden="true"
        >
          <Quote
            size={28}
            strokeWidth={0}
            fill="currentColor"
          />
        </div>
      </div>

      {hasContent ? (
        <>
          <blockquote className="testimonial-card__quote skeleton-target">
            {testimonial.quote}
          </blockquote>

          <footer className="testimonial-card__footer">
            <div className="testimonial-card__avatar-wrap skeleton-target">
              {testimonial.avatar ? (
                <img
                  className="testimonial-card__avatar"
                  src={testimonial.avatar}
                  style={{ objectPosition: `${testimonial.focalX ?? 50}% ${testimonial.focalY ?? 50}%`, transform: `scale(${testimonial.zoom ?? 1})`, transformOrigin: `${testimonial.focalX ?? 50}% ${testimonial.focalY ?? 50}%` }}
                  alt=""
                  loading="lazy" decoding="async"
                  onError={(event) => {
                    event.currentTarget.hidden = true

                    const fallback =
                      event.currentTarget.nextElementSibling

                    if (fallback) {
                      fallback.hidden = false
                    }
                  }}
                />
              ) : null}

              <span
                className="testimonial-card__avatar-fallback skeleton-target"
                hidden={Boolean(testimonial.avatar)}
                aria-hidden="true"
              >
                {getPersonInitial(testimonial.person)}
              </span>
            </div>

            <div className="testimonial-card__author">
              {testimonial.person ? (
                <p className="testimonial-card__person skeleton-target">
                  {testimonial.person}
                </p>
              ) : null}

              {testimonial.role ? (
                <p className="testimonial-card__role skeleton-target">
                  {testimonial.role}
                </p>
              ) : null}

              {testimonial.organization ? (
                <p className="testimonial-card__organization skeleton-target">
                  {testimonial.organization}
                </p>
              ) : null}
            </div>
          </footer>
        </>
      ) : null}
    </article>
  )
}

export function TestimonialsSection({
  copy = {},
  testimonials = [],
  loading = false,
  error = null,
}) {
  const { t } = useTranslation()
  const visibleTestimonials = loading ? createSkeletonItems(3, 'testimonial').map((item) => ({ ...item, quote: '████████ ████████ ████████ ████████ ████████ ████████ ████████ ████████', person: '████████ ████████', role: '████████ ████████', organization: '████████' })) : testimonials

  return (
    <NeotekSection
      className={`testimonials-section${loading ? ' is-loading' : ''}`}
      aria-busy={loading}
      aria-labelledby="testimonials-heading"
    >
      <NeotekContainer className="testimonials-container">
        <div className="testimonials-heading">
          <h2
            id="testimonials-heading"
            className="testimonials-heading__title"
          >
            {(copy.title || '')}
          </h2>
        </div>

        {!loading && error ? (
          <p
            className="testimonials-status testimonials-status--error"
            role="alert"
          >
            {t('testimonials.loadError', {
              defaultValue: 'Không thể tải phản hồi khách hàng.',
            })}
          </p>
        ) : null}

        {!loading && !error && testimonials.length === 0 ? (
          <p className="testimonials-status">
            {t('testimonials.empty', {
              defaultValue: 'Hiện chưa có phản hồi khách hàng.',
            })}
          </p>
        ) : null}

        {(loading || !error) && visibleTestimonials.length > 0 ? (
          <div
            className="testimonials-viewport"
                aria-hidden={loading || undefined}
                inert={loading ? '' : undefined}
            aria-label={(copy.title || '')}
          >
            <div className="testimonials-track">
              {visibleTestimonials.map((testimonial) => (
                <div
                  className="testimonials-slide"
                  key={testimonial.id}
                >
                  <TestimonialCard testimonial={testimonial} loading={loading} />
                </div>
              ))}

              {visibleTestimonials.map((testimonial) => (
                <div
                  className="testimonials-slide"
                  key={`marquee-${testimonial.id}`}
                  aria-hidden="true"
                >
                  <TestimonialCard testimonial={testimonial} loading={loading} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </NeotekContainer>
    </NeotekSection>
  )
}
