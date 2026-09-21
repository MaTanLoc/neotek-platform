import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, Globe, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { setLanguage } from '../../../i18n'
import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import './neotek-navbar.css'

const navigationItems = [
  { key: 'solutions', href: '/solutions', hasDropdown: true },
  { key: 'about', href: '/about', hasDropdown: true },
  { key: 'careers', href: '/careers', hasDropdown: true },
  { key: 'support', href: '/support', hasDropdown: true },
  { key: 'knowledge', href: '/knowledge', hasDropdown: true },
]

export function NeotekNavbar({ brand = 'NeoTek' }) {
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'en' ? 'en' : 'vi'
  const toggleLanguage = () => setLanguage(language === 'vi' ? 'en' : 'vi')

  return (
    <header className="neotek-navbar">
      <NeotekContainer className="neotek-navbar__inner">
        <a className="neotek-navbar__brand" href="/" aria-label={brand}>
          <span className="neotek-navbar__brand-mark" aria-hidden="true">
            <span className="neotek-navbar__brand-mark-inner" />
          </span>
          <span className="neotek-navbar__brand-text">{brand}</span>
        </a>

        <nav className="neotek-navbar__nav" aria-label={t('nav.main')}>
          <ul className="neotek-navbar__menu">
            {navigationItems.map((item) => (
              <li key={item.key} className="neotek-navbar__item">
                <a className="neotek-navbar__link" href={item.href}>
                  <span>{t(`nav.${item.key}`)}</span>
                  {item.hasDropdown ? <ChevronDown size={14} aria-hidden="true" /> : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="neotek-navbar__actions">
          <button type="button" className="neotek-navbar__language" aria-label={t('nav.language')} onClick={toggleLanguage}>
            <Globe size={16} aria-hidden="true" />
            <span>VI</span>
          </button>
          <a className="neotek-navbar__login" href="/login">
            {t('nav.login')}
          </a>
          <NeotekButton href="/demo" className="neotek-navbar__cta">
            {t('nav.demo')}
          </NeotekButton>
        </div>

        <div className="neotek-navbar__mobile-tools">
          <Dialog.Root>
            <Dialog.Trigger className="neotek-navbar__menu-button" aria-label={t('nav.openMenu')}>
              <Menu size={20} aria-hidden="true" />
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="neotek-navbar__overlay" />
              <Dialog.Content className="neotek-navbar__dialog" aria-label={t('nav.mobile')}>
                <div className="neotek-navbar__dialog-header">
                  <a className="neotek-navbar__brand neotek-navbar__brand--mobile" href="/" aria-label={brand}>
                    <span className="neotek-navbar__brand-mark" aria-hidden="true">
                      <span className="neotek-navbar__brand-mark-inner" />
                    </span>
                    <span className="neotek-navbar__brand-text">{brand}</span>
                  </a>

                  <Dialog.Close className="neotek-navbar__close" aria-label={t('nav.closeMenu')}>
                    <X size={20} aria-hidden="true" />
                  </Dialog.Close>
                </div>

                <nav className="neotek-navbar__mobile-nav" aria-label={t('nav.mobile')}>
                  <ul className="neotek-navbar__mobile-menu">
                    {navigationItems.map((item) => (
                      <li key={item.key}>
                        <a className="neotek-navbar__mobile-link" href={item.href}>
                          {t(`nav.${item.key}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="neotek-navbar__mobile-footer">
                  <button type="button" className="neotek-navbar__language neotek-navbar__language--mobile" aria-label={t('nav.language')} onClick={toggleLanguage}>
                    <Globe size={16} aria-hidden="true" />
                    <span>VI</span>
                  </button>
                  <a className="neotek-navbar__login neotek-navbar__login--mobile" href="/login">
                    {t('nav.login')}
                  </a>
                  <NeotekButton href="/demo" className="neotek-navbar__cta neotek-navbar__cta--mobile">
                    {t('nav.demo')}
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
