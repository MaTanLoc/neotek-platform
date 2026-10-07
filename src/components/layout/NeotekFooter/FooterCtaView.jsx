import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import './NeotekFooter.css'
export function FooterCtaView({ cta, titleId = 'footer-cta-title' }) {
  return (
        <section className="neotek-footer-cta" aria-labelledby={titleId}>
          <NeotekContainer className="neotek-footer-cta__container">
            <div className="neotek-footer-cta__card">
              <div className="neotek-footer-cta__content">
                <span className="neotek-footer-cta__eyebrow">{cta?.eyebrow}</span>
                <h2 id={titleId} className="neotek-footer-cta__title">
                  {cta?.title}
                </h2>
                <p className="neotek-footer-cta__description">
                  {cta?.description}
                </p>
              </div>

              {cta?.showPrimaryCta !== false && <NeotekButton variant={cta?.primaryVariant === 'secondary' ? 'outline' : cta?.primaryVariant || 'primary'} href={cta?.primaryUrl} className={`neotek-footer-cta__button neotek-footer-cta__button--${cta?.primaryVariant || 'primary'}`}>
                {cta?.primaryLabel}
              </NeotekButton>}
            </div>
          </NeotekContainer>
        </section>
  )
}
