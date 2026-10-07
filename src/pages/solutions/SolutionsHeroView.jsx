import { NeotekContainer } from '../../components/common/NeotekContainer/NeotekContainer'
import { NeotekButton } from '../../components/common/NeotekButton/NeotekButton'
import { ChevronRight } from 'lucide-react'
import { getLocalizedPath } from '../../i18n'
import './SolutionsPage.css'

export function SolutionsHeroView({ hero, language = 'vi', titleId = 'solutions-hero-title' }) {
  return (
        <section className="solutions-hero" aria-labelledby={titleId}>
          <NeotekContainer className="solutions-hero__inner">
            <div className="solutions-hero__copy">
              <p className="neotek-eyebrow">{hero.eyebrow}</p>
              <h1 id={titleId} className="solutions-hero__title">
                <span className="solutions-hero__title-line">
                  {hero.titleLine1 || hero.headline}
                </span>

                <span className="solutions-hero__title-line solutions-hero__title-line--highlight">
                  {hero.titleHighlight}
                </span>
              </h1>
              <p className="neotek-lead">{hero.description}</p>
              <div className="solutions-hero__actions">
                {hero.showPrimaryCta !== false && hero.primaryLabel && <NeotekButton
                  href={hero.primaryUrl ? hero.primaryUrl.startsWith('/') ? getLocalizedPath(hero.primaryUrl, language) : hero.primaryUrl : undefined}
                  className="solutions-hero__button solutions-hero__button--primary"
                >
                  {hero.primaryLabel}
                </NeotekButton>}

                {hero.showSecondaryCta !== false && hero.secondaryLabel && <a className="solutions-hero__link" href={hero.secondaryUrl ? hero.secondaryUrl.startsWith('/') ? getLocalizedPath(hero.secondaryUrl, language) : hero.secondaryUrl : undefined}>
                  {hero.secondaryLabel}
                  <ChevronRight size={14} aria-hidden="true" />
                </a>}
              </div>
            </div>
            <div
              className="solutions-hero__visual"
              role="img"
              aria-label={hero.visualLabel || hero.headline}
            >
              <div className="solutions-hero__visual-surface">
                <img
                  className="solutions-hero__dashboard"
                  src={hero.image || undefined}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </NeotekContainer>
        </section>
  )
}
