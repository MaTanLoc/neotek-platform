import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { useTranslation } from 'react-i18next'

const footerGroups = [
	{ titleKey: 'footer.groups.solutions', links: [{ key: 'neoerp', href: '/solutions' }, { key: 'business', href: '/solutions' }, { key: 'supplyChain', href: '/solutions' }, { key: 'manufacturing', href: '/solutions' }, { key: 'management', href: '/solutions' }] },
	{ titleKey: 'footer.groups.about', links: [{ key: 'about', href: '/about' }, { key: 'careers', href: '/careers' }, { key: 'partners', href: '/about' }] },
	{ titleKey: 'footer.groups.resources', links: [{ key: 'knowledge', href: '/knowledge' }] },
	{ titleKey: 'footer.groups.support', links: [{ key: 'faq', href: '#faq-heading' }, { key: 'contact', href: '#contact' }, { key: 'demo', href: '/demo' }, { key: 'support', href: '/support' }] },
]

const contact = {
	company: 'CÔNG TY TNHH NEOTEK',
	address: 'Số 02 Trường Sơn, Quận Tân Bình, TP. Hồ Chí Minh',
}

const legalLinks = [
	{ key: 'privacy', href: null },
	{ key: 'terms', href: null },
]

export function NeotekFooter() {
	const { t } = useTranslation()
	return (
		<footer className="neotek-footer" id="contact">
			<NeotekContainer className="neotek-footer__container">
				<div className="neotek-footer__brand-row">
					<div className="neotek-footer__brand-block">
						<a className="neotek-footer__brand" href="/" aria-label="NeoTek trang chủ">
							<span className="neotek-footer__brand-mark" aria-hidden="true">N</span>
							<span>NeoTek</span>
						</a>
						<p className="neotek-footer__tagline">{t('footer.tagline')}</p>
						<p className="neotek-footer__description">{t('footer.description')}</p>
					</div>
					<div className="neotek-footer__cta">
						<p className="neotek-footer__cta-label">{t('footer.cta')}</p>
						<NeotekButton href="/demo" className="neotek-footer__cta-button">{t('footer.demo')}</NeotekButton>
					</div>
				</div>

				<nav className="neotek-footer__nav" aria-label="Điều hướng chân trang">
					{footerGroups.map((group) => (
						<div className="neotek-footer__group" key={group.title}>
							  <h2 className="neotek-footer__group-title">{t(group.titleKey)}</h2>
							<ul className="neotek-footer__links">
								{group.links.map((link) => <li key={link.key}><a href={link.href}>{t(`footer.links.${link.key}`)}</a></li>)}
							</ul>
						</div>
					))}
				</nav>

				<div className="neotek-footer__contact">
					  <p className="neotek-footer__contact-company">{contact.company}</p>
					  <div className="neotek-footer__contact-item"><span>{t('footer.addressLabel')}</span><address>{contact.address}</address></div>
				</div>

				<div className="neotek-footer__bottom">
					<p>{t('footer.copyright')}</p>
					<nav className="neotek-footer__legal" aria-label={t('footer.legal')}>
						{legalLinks.map((link) => <a key={link.label} href={link.href || undefined} aria-disabled={!link.href}>{t(`footer.${link.key}`)}</a>)}
					</nav>
				</div>
			</NeotekContainer>
		</footer>
	)
}
