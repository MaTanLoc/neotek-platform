import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { useTranslation } from 'react-i18next'
import './NeotekFooter.css'

gsap.registerPlugin(ScrollTrigger)

const footerGroups = [
  {
    titleKey: 'footer.groups.solutions',
    links: [
      { key: 'neoerp', href: '/solutions' },
      { key: 'business', href: '/solutions' },
      { key: 'supplyChain', href: '/solutions' },
      { key: 'manufacturing', href: '/solutions' },
      { key: 'management', href: '/solutions' },
    ],
  },
  {
    titleKey: 'footer.groups.about',
    links: [
      { key: 'about', href: '/about' },
      { key: 'careers', href: '/careers' },
      { key: 'partners', href: '/about' },
      { key: 'knowledge', href: '/knowledge' },
    ],
  },
  {
    titleKey: 'footer.groups.support',
    links: [
      { key: 'faq', href: '#faq-heading' },
      { key: 'contact', href: '#contact' },
      { key: 'demo', translationKey: 'footer.demo', href: '/demo' },
      { key: 'support', href: '/support' },
    ],
  },
]

const legalLinks = [
  { key: 'privacy', href: null },
  { key: 'terms', href: null },
]

export function NeotekFooter({ demoHref = '/demo', showCta = true }) {
  const { t } = useTranslation()
  const footerRef = useRef(null)

  useLayoutEffect(() => {
    if (!showCta) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.neotek-footer-cta__card',
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.neotek-footer-cta__card',
            start: 'top 82%',
            once: true,
          },
        }
      )
    }, footerRef)

    return () => ctx.revert()
  }, [showCta])

  return (
    <div ref={footerRef}>
      {showCta && (
        <section className="neotek-footer-cta" aria-labelledby="footer-cta-title">
          <NeotekContainer className="neotek-footer-cta__container">
            <div className="neotek-footer-cta__card">
              <div className="neotek-footer-cta__content">
                <span className="neotek-footer-cta__eyebrow">NeoERP</span>
                <h2 id="footer-cta-title" className="neotek-footer-cta__title">
                  {t('footer.cta')}
                </h2>
                <p className="neotek-footer-cta__description">
                  {t('footer.ctaDescription')}
                </p>
              </div>

              <NeotekButton href={demoHref} className="neotek-footer-cta__button">
                {t('footer.demo')}
              </NeotekButton>
            </div>
          </NeotekContainer>
        </section>
      )}

      <footer className="neotek-footer" id="contact">
        <NeotekContainer className="neotek-footer__container">
          <div className="neotek-footer__main">
            <div className="neotek-footer__company">
              <a className="neotek-footer__logo" href="/" aria-label="NeoTek">
                <img
                  src="/assets/logo/logo_306x98.png"
                  loading="lazy" decoding="async"
                  alt="NeoTek"
                />
              </a>

              <p className="neotek-footer__company-name">
                {t('footer.company')}
              </p>

              <div className="neotek-footer__contact-list">
                <div className="neotek-footer__contact-item">
                  <span>{t('footer.addressLabel')}:</span>
                  <address>{t('footer.address')}</address>
                </div>
              </div>

              <p className="neotek-footer__description">
                {t('footer.description')}
              </p>
            </div>

            <nav className="neotek-footer__nav" aria-label={t('footer.navigation')}>
              {footerGroups.map((group) => (
                <div className="neotek-footer__group" key={group.titleKey}>
                  <p className="neotek-footer__group-title">
                    {t(group.titleKey)}
                  </p>

                  <ul className="neotek-footer__links">
                    {group.links.map((link) => (
                      <li key={link.key}>
                        <a href={link.key === 'demo' ? demoHref : link.href}>
                          {t(link.translationKey || `footer.links.${link.key}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="neotek-footer__bottom">
            <p>{t('footer.copyright')}</p>

            <nav className="neotek-footer__legal" aria-label={t('footer.legal')}>
              {legalLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href || undefined}
                  aria-disabled={!link.href}
                >
                  {t(`footer.${link.key}`)}
                </a>
              ))}
            </nav>
          </div>
        </NeotekContainer>
      </footer>
    </div>
  )
}
