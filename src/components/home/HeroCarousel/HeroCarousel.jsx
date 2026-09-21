import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { heroSlides } from './heroSlides'
import './HeroCarousel.css'

export function HeroCarousel() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
    },
    [
      Autoplay({
        delay: 5000,
        stopOnInteraction: true,
        stopOnFocusIn: true,
        playOnInit: !prefersReducedMotion,
      }),
    ],
  )

  const scrollTo = useCallback(
    (index) => {
      if (!emblaApi) {
        return
      }

      emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  useEffect(() => {
    if (!emblaApi) {
      return undefined
    }

    const handleSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on('select', handleSelect)
    handleSelect()

    return () => emblaApi.off('select', handleSelect)
  }, [emblaApi])

  return (
    <section className="hero-carousel" aria-label="NeoTek">
      <div className="hero-carousel__viewport" ref={emblaRef}>
        <div className="hero-carousel__container">
          {heroSlides.map((slide, index) => {
            const isActive = index === selectedIndex
            const hasImage = Boolean(slide.image)
            const hasContent = Boolean(slide.content)

            const slideStyle = {
              '--hero-image-position': slide.imagePosition || 'center',
              '--hero-mobile-image-position':
                slide.mobileImagePosition || slide.imagePosition || 'center',
            }

            return (
              <motion.article
                key={slide.id}
                className={[
                  'hero-slide',
                  `hero-slide--content-${slide.contentPosition || 'left'}`,
                  `hero-slide--overlay-${slide.overlay || 'default'}`,
                  isActive ? 'is-active' : '',
                  hasImage ? 'has-image' : 'no-image',
                  hasContent ? 'has-content' : 'no-content',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={slideStyle}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.45, ease: 'easeOut' }
                }
              >
                {hasImage ? (
                  <picture className="hero-slide__background" aria-hidden="true">
                    {slide.mobileImage ? (
                      <source
                        media="(max-width: 767px)"
                        srcSet={slide.mobileImage}
                      />
                    ) : null}

                    <img
                      src={slide.image}
                      alt=""
                      className="hero-slide__background-image"
                      draggable="false"
                    />
                  </picture>
                ) : null}

                {hasImage && slide.overlay !== 'none' ? (
                  <div className="hero-slide__overlay" aria-hidden="true" />
                ) : null}

                {hasContent ? (
                  <div className="hero-slide__content">
                    <p className="hero-slide__eyebrow">
                      {t(slide.content.eyebrowKey)}
                    </p>

                    <h1 className="hero-slide__title">
                      {t(slide.content.titleKey)}
                    </h1>

                    {slide.content.description ? (
                      <p className="hero-slide__description">
                        {t(slide.content.descriptionKey)}
                      </p>
                    ) : null}

                    {(slide.content.primaryCtaKey || slide.content.secondaryCtaKey) ? (
                      <div className="hero-slide__actions">
                        {slide.content.primaryCtaKey ? (
                          <NeotekButton
                            href={slide.content.primaryHref}
                            className="hero-slide__button hero-slide__button--primary"
                          >
                            {t(slide.content.primaryCtaKey)}
                          </NeotekButton>
                        ) : null}

                        {slide.content.secondaryCtaKey ? (
                          <a
                            className="hero-slide__link"
                            href={slide.content.secondaryHref}
                          >
                            {t(slide.content.secondaryCtaKey)}
                            <ChevronRight size={14} aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </motion.article>
            )
          })}
        </div>
      </div>

      {/* Hero pagination only — no extra navigation row */}
      <div
        className="hero-carousel__pagination"
        role="tablist"
        aria-label={t('hero.choose')}
      >
        {heroSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`hero-carousel__dot ${
              index === selectedIndex ? 'is-active' : ''
            }`}
            onClick={() => scrollTo(index)}
            aria-label={t('hero.slide', { count: index + 1 })}
            aria-selected={index === selectedIndex}
            role="tab"
          />
        ))}
      </div>
    </section>
  )
}