import { useLocation, Link } from 'react-router-dom'
import SEO from '../../components/common/SEO/SEO'
import { NeotekContainer } from '../../components/common/NeotekContainer/NeotekContainer'
import { getLanguageFromPathname } from '../../i18n'
import './NotFoundPage.css'

export default function NotFoundPage() {
  const { pathname } = useLocation()
  const english = getLanguageFromPathname(pathname) === 'en'
  const title = english ? 'Page not found' : 'Không tìm thấy trang'
  const description = english
    ? 'The page you requested does not exist. Please return to the homepage.'
    : 'Trang bạn yêu cầu không tồn tại. Vui lòng quay về trang chủ.'

  return (
    <main className="neotek-not-found">
      <SEO title={`${title} | Neotek`} description={description} robots="noindex, follow" />
      <NeotekContainer>
        <p className="neotek-not-found__code">404</p>
        <h1>{title}</h1>
        <p className="neotek-not-found__description">{description}</p>
        <Link className="neotek-button neotek-button--primary" to={english ? '/en' : '/'}>
          {english ? 'Back to homepage' : 'Quay về trang chủ'}
        </Link>
      </NeotekContainer>
    </main>
  )
}
