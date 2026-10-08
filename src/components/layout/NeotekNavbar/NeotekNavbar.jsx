import { FEATURES } from '../../../config/features'
import { buildSolutionDetailPath } from '../../../config/solutionRoutes'
import { captureLocaleScroll } from '../../common/SmoothScroll/SmoothScroll'
import * as Dialog from '@radix-ui/react-dialog'
import * as Accordion from '@radix-ui/react-accordion'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import { ChevronRight, ChevronDown, Globe, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getLocalizedPath, setLanguage } from '../../../i18n'
import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import './neotek-navbar.css'

const navigationItems = [
  {
    key: 'solutions',
    href: '/solutions',
    children: [
      { key: 'overview', href: '/solutions' },
      {
        key: 'modules',
        children: [
          { key: 'sales', href: '/solutions/sales' },
          { key: 'crm', href: '/solutions/crm' },
          { key: 'purchasing', href: '/solutions/purchasing' },
          { key: 'warehouse', href: '/solutions/warehouse' },
          { key: 'logistics', href: '/solutions/logistics' },
          { key: 'projects', href: '/solutions/projects' },
          { key: 'production', href: '/solutions/production' },
          { key: 'hrPayroll', href: buildSolutionDetailPath('nhan-su-tien-luong') },
          { key: 'finance', href: '/solutions/finance' },
        ],
      },
      { key: 'features', href: '/solutions/features' },
    ],
  },
  {
    key: 'about',
    href: '/about',
    children: [
      { key: 'introduction', href: '/about' },
      { key: 'capabilities', href: '/about/capabilities' },
      { key: 'team', href: '/about/team' },
    ],
  },
  {
    key: 'careers',
    href: '/careers',
  },
  {
    key: 'support',
    href: '/support',
    children: [
      { key: 'supportCenter', href: '/support' },
      { key: 'guides', href: '/support/guides' },
      { key: 'documents', href: '/support/documents' },
      { key: 'faq', href: '/faq' },
    ],
  },
  {
    key: 'contact',
    href: '/contact',
  },
]

const solutionGroups = [
  {
    key: 'business',
    modules: [
      { key: 'sales', href: '/solutions/sales', image: 'https://aramex.vn/wp-content/uploads/2023/05/portrait-asian-woman-business-owner-using-digital-tablet-checking-amount-stock-product-inventory-shelf-distribution-warehouse-factorylogistic-business-shipping-delivery-service-scaled.jpg' },
      { key: 'crm', href: '/solutions/crm', image: 'https://fiftify.com/wp-content/uploads/2026/06/crm-and-inventory-management-a-practical-guide-to-smarter-sales-and-stock-control.jpg' },
    ],
  },
  {
    key: 'supplyChain',
    modules: [
      { key: 'purchasing', href: '/solutions/purchasing', image: 'https://images.unsplash.com/photo-1556741533-f6acd6474059?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      { key: 'warehouse', href: '/solutions/warehouse', image: 'https://images.unsplash.com/photo-1664382953403-fc1ac77073a0?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      { key: 'logistics', href: '/solutions/logistics', image: 'https://images.unsplash.com/photo-1606964212858-c215029db704?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    ],
  },
  {
    key: 'operations',
    modules: [
      { key: 'projects', href: '/solutions/projects', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      { key: 'production', href: '/solutions/production', image: 'https://images.unsplash.com/photo-1647427060118-4911c9821b82?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    ],
  },
  {
    key: 'management',
    modules: [
      { key: 'hrPayroll', href: buildSolutionDetailPath('nhan-su-tien-luong'), image: 'https://images.unsplash.com/photo-1772588627342-5ec373e236d8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      { key: 'finance', href: '/solutions/finance', image: 'https://images.unsplash.com/photo-1553877522-88290367491d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    ],
  },
]

function LanguageDropdown({ mobile = false }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const language = i18n.language === 'en' ? 'en' : 'vi'

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleLanguageChange = async (nextLanguage) => {
    if (nextLanguage === language) {
      setIsOpen(false)
      return
    }

    const nextPath = getLocalizedPath(
      location.pathname,
      nextLanguage,
    )

    const localeScroll = captureLocaleScroll()
    await setLanguage(nextLanguage)

    navigate(`${nextPath}${location.search}${location.hash}`, { state: { localeScroll } })

    setIsOpen(false)
  }

  return (
    <div
      ref={dropdownRef}
      className={`neotek-navbar__language-dropdown${mobile ? ' neotek-navbar__language-dropdown--mobile' : ''
        }`}
    >
      <button
        type="button"
        className={`neotek-navbar__language${isOpen ? ' neotek-navbar__language--open' : ''
          }`}
        aria-label={t('nav.language')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Globe size={16} aria-hidden="true" />
        <span>{language.toUpperCase()}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`neotek-navbar__language-chevron${isOpen ? ' neotek-navbar__language-chevron--open' : ''
            }`}
        />
      </button>

      {isOpen ? (
        <div
          className="neotek-navbar__language-menu"
          role="menu"
          aria-label={t('nav.language')}
        >
          <button
            type="button"
            role="menuitem"
            className={`neotek-navbar__language-option${language === 'vi'
              ? ' neotek-navbar__language-option--active'
              : ''
              }`}
            aria-current={language === 'vi' ? 'true' : undefined}
            onClick={() => handleLanguageChange('vi')}
          >
            Tiếng Việt
          </button>

          <button
            type="button"
            role="menuitem"
            className={`neotek-navbar__language-option${language === 'en'
              ? ' neotek-navbar__language-option--active'
              : ''
              }`}
            aria-current={language === 'en' ? 'true' : undefined}
            onClick={() => handleLanguageChange('en')}
          >
            English
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function NeotekNavbar({
  brand = 'NeoTek',
  heroSelector = '[data-neotek-hero], .neotek-hero, .hero',
  heroLogoSrc = '/assets/logo/logo_306x98_w.png',
}) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
  const isHomePage = normalizedPath === '/' || normalizedPath === '/en' || normalizedPath === '/vi'

  const language = i18n.language === 'en' ? 'en' : 'vi'

  const localizeHref = (href) =>
    getLocalizedPath(href, language)
  const [activeSolutionGroup, setActiveSolutionGroup] = useState('business')
  const [showScrolledNavbar, setShowScrolledNavbar] = useState(!isHomePage)

  useEffect(() => {
    if (!isHomePage) {
      setShowScrolledNavbar(true)
      return undefined
    }

    let frameId = null
    let heroElement = null

    const findHero = () => {
      const selectors = [
        heroSelector,
        '[data-neotek-hero]',
        '[data-hero]',
        '.neotek-hero',
        '.hero',
        '.hero-section',
        'main > section:first-of-type',
        'main > div:first-child',
      ].filter(Boolean)

      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector)

          if (element) {
            return element
          }
        } catch {
          // Ignore invalid optional selectors and continue with fallbacks.
        }
      }

      return null
    }

    const updateNavbarState = () => {
      frameId = null

      if (!heroElement) {
        heroElement = findHero()
      }

      if (!heroElement) return

      const heroBottom = heroElement.getBoundingClientRect().bottom

      setShowScrolledNavbar((current) => {
        // Small hysteresis prevents flicker around the exact boundary.
        if (current) {
          return heroBottom > 24 ? false : true
        }

        return heroBottom <= -4
      })
    }

    const handleScroll = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(updateNavbarState)
    }

    const handleResize = () => {
      heroElement = findHero()

      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateNavbarState)
      }
    }

    heroElement = findHero()
    updateNavbarState()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [heroSelector, isHomePage])

  const renderNavbar = (variant) => {
    const isHeroNavbar = variant === 'hero'
    const isScrolledNavbar = variant === 'scrolled'

    return (
      <header
        className={`neotek-navbar ${isHeroNavbar
          ? 'neotek-navbar--hero'
          : `neotek-navbar--scrolled${(showScrolledNavbar || !isHomePage) ? ' is-visible' : ''
          }`
          }`}
        aria-hidden={isScrolledNavbar ? !showScrolledNavbar : undefined}
      >
        <NeotekContainer className="neotek-navbar__inner">
          <a className="neotek-navbar__brand" href={localizeHref('/')} aria-label={brand}>
            <img
              className="neotek-navbar__logo"
              src={isHeroNavbar ? heroLogoSrc : '/assets/logo/logo_306x98.png'}
              alt={brand}
            />
          </a>

          <NavigationMenu.Root
            className="neotek-navbar__nav"
            delayDuration={100}
          >
            <NavigationMenu.List className="neotek-navbar__menu">
              {navigationItems.map((item) => {
                const hasChildren = item.children?.length > 0

                if (!hasChildren) {
                  return (
                    <NavigationMenu.Item key={item.key}>
                      <NavigationMenu.Link
                        href={localizeHref(item.href)}
                        className="neotek-navbar__link"
                      >
                        {t(`nav.${item.key}`)}
                      </NavigationMenu.Link>
                    </NavigationMenu.Item>
                  )
                }

                return (
                  <NavigationMenu.Item key={item.key}>
                    <NavigationMenu.Trigger className="neotek-navbar__link">
                      {t(`nav.${item.key}`)}
                      <ChevronDown
                        size={14}
                        aria-hidden="true"
                        className="neotek-navbar__menu-chevron"
                      />
                    </NavigationMenu.Trigger>

                    <NavigationMenu.Content className="neotek-navbar__submenu">
                      {item.key === 'solutions' ? (
                        <div className="neotek-navbar__solutions-menu">
                          <div
                            className="neotek-navbar__solutions-groups"
                            aria-label={t('nav.solutionsMenu.groupsLabel')}
                          >
                            {solutionGroups.map((group) => (
                              <button
                                key={group.key}
                                type="button"
                                className="neotek-navbar__solution-group"
                                data-active={activeSolutionGroup === group.key}
                                onMouseEnter={() => setActiveSolutionGroup(group.key)}
                                onFocus={() => setActiveSolutionGroup(group.key)}
                                aria-selected={activeSolutionGroup === group.key}
                              >
                                <span className="neotek-navbar__solution-group-title">
                                  {t(`nav.solutionsMenu.groups.${group.key}`)}
                                </span>
                                <span
                                  className="neotek-navbar__solution-group-arrow"
                                  aria-hidden="true"
                                >
                                  →
                                </span>
                              </button>
                            ))}

                            <NavigationMenu.Link
                              href={localizeHref('/solutions')}
                              className="neotek-navbar__solutions-overview"
                            >
                              <span>{t('nav.solutionsMenu.overview')}</span>
                              <span className="neotek-navbar__solutions-overview-arrow" aria-hidden="true">
                                →
                              </span>
                            </NavigationMenu.Link>
                          </div>

                          <div className="neotek-navbar__solutions-content">
                            {solutionGroups.map((group) => (
                              <div
                                key={group.key}
                                className="neotek-navbar__solution-panel"
                                data-active={activeSolutionGroup === group.key}
                              >
                                <div className="neotek-navbar__solution-grid">
                                  {group.modules.map((module) => (
                                    <NavigationMenu.Link
                                      key={module.key}
                                      href={localizeHref(module.href)}
                                      className="neotek-navbar__solution-card"
                                    >
                                      <div className="neotek-navbar__solution-card-image-wrap">
                                        <img
                                          src={module.image}
                                          alt=""
                                          className="neotek-navbar__solution-card-image"
                                          loading="lazy"
                                        />
                                      </div>
                                      <span className="neotek-navbar__solution-card-title">
                                        {t(`nav.solutionsMenu.${module.key}`)}
                                      </span>
                                      <span className="neotek-navbar__solution-card-description">
                                        {t(`nav.solutionsMenu.${module.key}Description`)}
                                      </span>
                                    </NavigationMenu.Link>
                                  ))}
                                </div>

                                <NavigationMenu.Link
                                  href={localizeHref('/solutions/features')}
                                  className="neotek-navbar__solutions-features-link"
                                >
                                  <span>{t('nav.solutionsMenu.features')}</span>
                                  <span aria-hidden="true">→</span>
                                </NavigationMenu.Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="neotek-navbar__simple-menu">
                          <div className="neotek-navbar__simple-menu-list">
                            {item.children.map((child) => (
                              <NavigationMenu.Link
                                key={child.key}
                                href={child.href}
                                className="neotek-navbar__submenu-link neotek-navbar__submenu-link--rich"
                              >
                                <span className="neotek-navbar__submenu-link-title">
                                  {t(`nav.${item.key}Menu.${child.key}`)}
                                </span>
                                <span className="neotek-navbar__submenu-link-description">
                                  {t(`nav.${item.key}Menu.${child.key}Description`)}
                                </span>
                              </NavigationMenu.Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </NavigationMenu.Content>
                  </NavigationMenu.Item>
                )
              })}
            </NavigationMenu.List>

          </NavigationMenu.Root>

          <div className="neotek-navbar__actions">
            <LanguageDropdown />

            {FEATURES.publicAuth && <a className="neotek-navbar__login" href={localizeHref('/login')}>
              {t('nav.login')}
            </a>}

            <NeotekButton href={localizeHref('/register')} className="neotek-navbar__cta">
              <span className="neotek-navbar__cta-text">
                {t('nav.demo')}
              </span>

              <ChevronRight
                size={16}
                aria-hidden="true"
                className="neotek-navbar__cta-arrow"
              />
            </NeotekButton>
          </div>

          <div className="neotek-navbar__mobile-tools">
            <Dialog.Root>
              <Dialog.Trigger
                className="neotek-navbar__menu-button"
                aria-label={t('nav.openMenu')}
              >
                <Menu size={20} aria-hidden="true" />
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="neotek-navbar__overlay" />

                <Dialog.Content
                  className="neotek-navbar__dialog"
                  aria-label={t('nav.mobile')}
                >
                  <div className="neotek-navbar__dialog-header">
                    <a
                      className="neotek-navbar__dialog-brand"
                      href={localizeHref('/')}
                      aria-label={brand}
                    >
                      <img
                        src="/assets/logo/logo_306x98.png"
                        alt={brand}
                      />
                    </a>

                    <Dialog.Close
                      className="neotek-navbar__close"
                      aria-label={t('nav.closeMenu')}
                    >
                      <X size={20} aria-hidden="true" />
                    </Dialog.Close>
                  </div>

                  <nav
                    className="neotek-navbar__mobile-nav"
                    aria-label={t('nav.mobile')}
                  >
                    <Accordion.Root type="single" collapsible>
                      <ul className="neotek-navbar__mobile-menu">
                        {navigationItems.map((item) => {
                          const hasChildren = item.children?.length > 0

                          if (!hasChildren) {
                            return (
                              <li key={item.key}>
                                <a
                                  className="neotek-navbar__mobile-link"
                                  href={localizeHref(item.href)}
                                >
                                  {t(`nav.${item.key}`)}
                                </a>
                              </li>
                            )
                          }

                          return (
                            <li key={item.key}>
                              <Accordion.Item value={item.key}>
                                <Accordion.Header>
                                  <Accordion.Trigger className="neotek-navbar__mobile-link">
                                    <span>{t(`nav.${item.key}`)}</span>
                                    <ChevronDown
                                      size={16}
                                      aria-hidden="true"
                                    />
                                  </Accordion.Trigger>
                                </Accordion.Header>

                                <Accordion.Content className="neotek-navbar__mobile-submenu">
                                  {item.key === 'solutions' ? (
                                    <>
                                      <a href={localizeHref('/solutions')}>
                                        {t('nav.solutionsMenu.overview')}
                                      </a>

                                      {item.children[1].children.map((module) => (
                                        <a key={module.key} href={localizeHref(module.href)}>
                                          {t(`nav.solutionsMenu.${module.key}`)}
                                        </a>
                                      ))}

                                      <a href={localizeHref('/solutions/features')}>
                                        {t('nav.solutionsMenu.features')}
                                      </a>
                                    </>
                                  ) : (
                                    item.children.map((child) => (
                                      <a key={child.key} href={localizeHref(child.href)}>
                                        <span className="neotek-navbar__mobile-submenu-title">
                                          {t(`nav.${item.key}Menu.${child.key}`)}
                                        </span>
                                        <span className="neotek-navbar__mobile-submenu-description">
                                          {t(`nav.${item.key}Menu.${child.key}Description`)}
                                        </span>
                                      </a>
                                    ))
                                  )}
                                </Accordion.Content>
                              </Accordion.Item>
                            </li>
                          )
                        })}
                      </ul>
                    </Accordion.Root>
                  </nav>

                  <div className="neotek-navbar__mobile-footer">
                    <LanguageDropdown mobile />

                    {FEATURES.publicAuth && <a
                      className="neotek-navbar__login neotek-navbar__login--mobile"
                      href={localizeHref('/login')}
                    >
                      {t('nav.login')}
                    </a>}

                    <NeotekButton
                      href={localizeHref('/register')}
                      className="neotek-navbar__cta neotek-navbar__cta--mobile"
                    >
                      {t('nav.demo')}
                      <ChevronRight size={16} aria-hidden="true" />
                    </NeotekButton>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </NeotekContainer>
      </header>
    )
  }

  return (
    <>
      {isHomePage ? (
        <>
          {renderNavbar('hero')}
          {createPortal(renderNavbar('scrolled'), document.body)}
        </>
      ) : (
        createPortal(renderNavbar('scrolled'), document.body)
      )}
    </>
  )
}
