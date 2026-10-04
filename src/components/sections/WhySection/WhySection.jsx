import { createSkeletonItems } from '../../../utils/skeleton'
import { useLayoutEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'

import './WhySection.css'

gsap.registerPlugin(ScrollTrigger)

export function WhySection({
  items = [],
  loading = false,
  error = null,
}) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const sectionRef = useRef(null)
  const visibleItems = loading ? createSkeletonItems(5, 'why').map((item) => ({ ...item, title: '████████ ████████', description: '████████ ████████ ████████ ████████' })) : items

  useLayoutEffect(() => {
    if (
      prefersReducedMotion ||
      loading ||
      error ||
      items.length === 0
    ) {
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.from('.why-proof-item', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          once: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [prefersReducedMotion, loading, error, items.length])

  return (
    <NeotekSection
      className={`why-section${loading ? ' is-loading' : ''}`}
      aria-busy={loading}
      aria-labelledby="why-neotek-title"
    >
      <NeotekContainer>
        <motion.div
          className="why-section__intro"
          initial={
            prefersReducedMotion
              ? false
              : { opacity: 0, y: 18 }
          }
          whileInView={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0 }
          }
          viewport={{
            once: true,
            amount: 0.25,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.45,
            ease: 'easeOut',
          }}
        >
          <h2
            id="why-neotek-title"
            className="why-section__title"
          >
            <span className="why-section__title-highlight">
              {t('why.titleHighlight')}
            </span>

            <span className="why-section__title-rest">
              {t('why.titleRest')}
            </span>
          </h2>

          <p className="why-section__description">
            {t('why.description')}
          </p>
        </motion.div>

        <div
          ref={sectionRef}
          className="why-proof-grid"
                aria-hidden={loading || undefined}
                inert={loading ? '' : undefined}
        >

          {!loading && error ? (
            <p
              className="why-section__status why-section__status--error"
              role="alert"
            >
              {t('why.loadError', {
                defaultValue: 'Không thể tải nội dung.',
              })}
            </p>
          ) : null}

          {!loading && !error && items.length === 0 ? (
            <p className="why-section__status">
              {t('why.empty', {
                defaultValue: 'Hiện chưa có nội dung.',
              })}
            </p>
          ) : null}

          {(loading || !error) && visibleItems.map((item) => (
              <article
                key={item.id}
                className="why-proof-item"
              >
                {loading || item.icon ? (
                  <div className="why-proof-item__icon-wrap skeleton-target">
                    <div
                      className="why-proof-item__icon skeleton-target"
                      aria-hidden="true"
                    >
                      {!loading && <img
                        className="why-proof-item__icon-image"
                        src={item.icon}
                        alt=""
                        loading="lazy" decoding="async"
                        aria-hidden="true"
                      />}
                    </div>
                  </div>
                ) : null}

                <div className="why-proof-item__content">
                  <h3 className="why-proof-item__title skeleton-target">
                    {item.title}
                  </h3>

                  <p className="why-proof-item__description skeleton-target">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
        </div>
      </NeotekContainer>
    </NeotekSection>
  )
}