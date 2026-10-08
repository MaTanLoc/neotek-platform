import { isPublicHrefEnabled } from '../../../config/features'
import { optimizeCloudinaryImage } from '../../../utils/images'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import './HeroCarousel.css'

export function HomeHeroView({ slide, index = 0, active = true, showInitialSkeleton = false, prefersReducedMotion = true }) {
            const isActive = active
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

                        {hasSecondaryCta && isPublicHrefEnabled(slide.secondaryUrl) ? (
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

}
