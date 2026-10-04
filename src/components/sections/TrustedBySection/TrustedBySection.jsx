import { createSkeletonItems } from '../../../utils/skeleton'
import { useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'

import './TrustedBySection.css'

function LogoItem({ logo, loading }) {
  return (
    <div
      className="trusted-by-logo-item"
      style={{
        '--logo-width': `${logo.width}px`,
        '--logo-scale': logo.scale ?? 1,
      }}
    >
      <div className="trusted-logo skeleton-target">
        {!loading && <img
          src={logo.src}
          alt={logo.alt}
          loading="lazy" decoding="async"
        />}
      </div>
    </div>
  )
}

export function TrustedBySection({
  logos = [],
  loading = false,
  error = null,
}) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const visibleLogos = loading ? createSkeletonItems(8, 'logo').map((logo) => ({ ...logo, width: 160 })) : logos

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      dragFree: true,
      containScroll: false,
    },
    [
      AutoScroll({
        speed: 0.9,
        playOnInit: !loading && !prefersReducedMotion,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
      }),
    ],
  )

  useEffect(() => {
    if (!emblaApi) return

    const autoScroll = emblaApi.plugins().autoScroll
    if (!autoScroll) return

    if (loading || prefersReducedMotion) {
      autoScroll.stop()
    } else {
      autoScroll.play()
    }
  }, [emblaApi, loading, prefersReducedMotion])

  useEffect(() => {
    if (!emblaApi || loading || error || logos.length === 0) return

    emblaApi.reInit()

    if (!prefersReducedMotion) {
      emblaApi.plugins().autoScroll?.play()
    }
  }, [
    emblaApi,
    loading,
    error,
    logos.length,
    prefersReducedMotion,
  ])

  return (
    <NeotekSection
      className={`trusted-by-section${loading ? ' is-loading' : ''}`}
      aria-busy={loading}
      aria-labelledby="trusted-by-heading"
    >
      <NeotekContainer className="trusted-by-container">
        <h2
          id="trusted-by-heading"
          className="trusted-by-title"
        >
          {t('trustedBy.title')}
        </h2>

        {(loading || !error) && visibleLogos.length > 0 ? (
          <div
            className="trusted-by-viewport"
                aria-hidden={loading || undefined}
                inert={loading ? '' : undefined}
            ref={emblaRef}
          >
            <div className="trusted-by-track">
              {visibleLogos.map((logo) => (
                <LogoItem
                  key={logo.id}
                  logo={logo}
                  loading={loading}
                />
              ))}
            </div>
          </div>
        ) : null}
      </NeotekContainer>
    </NeotekSection>
  )
}