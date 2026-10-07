import { createSkeletonItems } from '../../../utils/skeleton'
import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { HomeHeroView } from './HomeHeroView'
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
          {visibleSlides.map((slide, index) => <HomeHeroView key={slide.id} slide={slide} index={index} active={index === selectedIndex} showInitialSkeleton={showInitialSkeleton} prefersReducedMotion={prefersReducedMotion} />)}
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