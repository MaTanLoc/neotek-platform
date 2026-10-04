import { createSkeletonItems } from '../../../utils/skeleton'
import { optimizeCloudinaryImage } from '../../../utils/images'
import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import './HeroCarousel.css'

export function HeroCarousel({
  slides = [],
  loading = false,
  error = null,
}) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const showInitialSkeleton = loading && slides.length === 0

  const visibleSlides = showInitialSkeleton
    ? createSkeletonItems(3, 'hero').map((slide) => ({
      ...slide,
      showContent: true,
      eyebrow: '████████ ████████',
      headline: '████████ ████████ ████████',
      description:
        '████████ ████████ ████████ ████████ ████████ ████████',
      showPrimaryCta: true,
      primaryLabel: '████████ ████████',
      showSecondaryCta: true,
      secondaryLabel: '████████ ████████',
    }))
    : slides

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
        playOnInit: !showInitialSkeleton && !prefersReducedMotion,
      }),
    ],
  )

  const scrollTo = useCallback(
    (index) => {
      if (!emblaApi) return
      emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  useEffect(() => {
    if (!emblaApi) return undefined

    const handleSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on('select', handleSelect)
    handleSelect()

    return () => emblaApi.off('select', handleSelect)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    const autoplay = emblaApi.plugins()?.autoplay

    if (showInitialSkeleton || error || slides.length === 0) {
      autoplay?.stop()
      return
    }

    emblaApi.reInit()
    emblaApi.scrollTo(0)
    setSelectedIndex(0)

    if (prefersReducedMotion) {
      autoplay?.stop()
    } else {
      autoplay?.play()
    }
  }, [
    emblaApi,
    showInitialSkeleton,
    error,
    slides.length,
    prefersReducedMotion,
  ])

  if (!showInitialSkeleton && (error || slides.length === 0)) {
    return null
  }

  return (
    <section
      className={`hero-carousel${showInitialSkeleton ? ' is-loading' : ''}`}
      aria-busy={showInitialSkeleton}
      aria-label="NeoTek"
    >
      <div className="hero-carousel__viewport" ref={emblaRef}>
        <div className="hero-carousel__container">
          {visibleSlides.map((slide, index) => {
            const isActive = index === selectedIndex
            const hasImage =
              !showInitialSkeleton && Boolean(slide.image)

            const HeadingTag = index === 0 ? 'h1' : 'h2'

            const desktopImage = hasImage
              ? optimizeCloudinaryImage(slide.image, 1920)
              : ''

            const mobileImage = hasImage
              ? optimizeCloudinaryImage(
                slide.mobileImage || slide.image,
                900,
              )
              : ''

            const hasPrimaryCta =
              slide.showPrimaryCta &&
              (
                showInitialSkeleton ||
                Boolean(
                  slide.primaryLabel &&
                  slide.primaryUrl,
                )
              )

            const hasSecondaryCta =
              slide.showSecondaryCta &&
              (
                showInitialSkeleton ||
                Boolean(
                  slide.secondaryLabel &&
                  slide.secondaryUrl,
                )
              )

            const hasActions =
              hasPrimaryCta ||
              hasSecondaryCta

            const hasContent =
              slide.showContent &&
              Boolean(
                slide.eyebrow ||
                slide.headline ||
                slide.description ||
                hasActions,
              )

            const slideStyle = {
              '--hero-image-position':
                slide.imagePosition ||
                'center',

              '--hero-mobile-image-position':
                slide.mobileImagePosition ||
                slide.imagePosition ||
                'center',
            }

            return (
              <motion.article
                key={slide.id}
                className={[
                  'hero-slide',
                  showInitialSkeleton
                    ? 'skeleton-block'
                    : '',
                  `hero-slide--content-${slide.contentPosition ||
                  'left'
                  }`,
                  `hero-slide--overlay-${slide.overlay ||
                  'dark-left'
                  }`,
                  isActive
                    ? 'is-active'
                    : '',
                  hasImage
                    ? 'has-image'
                    : 'no-image',
                  hasContent
                    ? 'has-content'
                    : 'no-content',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={slideStyle}
                initial={
                  showInitialSkeleton ||
                    prefersReducedMotion
                    ? false
                    : { opacity: 0 }
                }
                animate={{ opacity: 1 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                      duration: 0.45,
                      ease: 'easeOut',
                    }
                }
              >
                {hasImage ? (
                  <picture
                    className="hero-slide__background"
                    aria-hidden="true"
                  >
                    {slide.mobileImage ||
                      mobileImage !==
                      slide.image ? (
                      <source
                        media="(max-width: 767px)"
                        srcSet={mobileImage}
                      />
                    ) : null}

                    <img
                      src={desktopImage}
                      alt=""
                      loading={
                        index === 0
                          ? 'eager'
                          : 'lazy'
                      }
                      decoding="async"
                      fetchpriority={
                        index === 0
                          ? 'high'
                          : 'auto'
                      }
                      className="hero-slide__background-image"
                      draggable="false"
                    />
                  </picture>
                ) : null}

                {hasImage &&
                  slide.overlay !==
                  'none' ? (
                  <div
                    className="hero-slide__overlay"
                    aria-hidden="true"
                  />
                ) : null}

                {hasContent ? (
                  <div
                    className="hero-slide__content"
                    aria-hidden={
                      showInitialSkeleton ||
                      undefined
                    }
                    inert={
                      showInitialSkeleton
                        ? ''
                        : undefined
                    }
                  >
                    {slide.eyebrow ? (
                      <p className="hero-slide__eyebrow skeleton-target">
                        {slide.eyebrow}
                      </p>
                    ) : null}

                    {slide.headline ? (
                      <HeadingTag className="hero-slide__title skeleton-target">
                        {slide.headline}
                      </HeadingTag>
                    ) : null}

                    {slide.description ? (
                      <p className="hero-slide__description skeleton-target">
                        {slide.description}
                      </p>
                    ) : null}

                    {hasActions ? (
                      <div className="hero-slide__actions">
                        {hasPrimaryCta ? (
                          <NeotekButton
                            href={
                              showInitialSkeleton
                                ? undefined
                                : slide.primaryUrl
                            }
                            disabled={
                              showInitialSkeleton
                            }
                            className="hero-slide__button hero-slide__button--primary skeleton-target"
                          >
                            {slide.primaryLabel}
                          </NeotekButton>
                        ) : null}

                        {hasSecondaryCta ? (
                          <a
                            className="hero-slide__link skeleton-target"
                            href={
                              showInitialSkeleton
                                ? undefined
                                : slide.secondaryUrl
                            }
                            aria-disabled={
                              showInitialSkeleton ||
                              undefined
                            }
                          >
                            {
                              slide.secondaryLabel
                            }

                            <ChevronRight
                              size={14}
                              aria-hidden="true"
                            />
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

      {visibleSlides.length > 1 ? (
        <div
          className="hero-carousel__pagination"
          role="tablist"
          aria-label={t('hero.choose')}
        >
          {visibleSlides.map(
            (slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`hero-carousel__dot ${index === selectedIndex
                  ? 'is-active'
                  : ''
                  }`}
                disabled={
                  showInitialSkeleton
                }
                onClick={() =>
                  scrollTo(index)
                }
                aria-label={t(
                  'hero.slide',
                  {
                    count: index + 1,
                  },
                )}
                aria-selected={
                  index ===
                  selectedIndex
                }
                role="tab"
              />
            ),
          )}
        </div>
      ) : null}
    </section>
  )
}