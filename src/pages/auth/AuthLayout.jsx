import './neotek-auth.css'
import { useTranslation } from 'react-i18next'

export default function AuthLayout({
  children,
  mode = 'login',
  title,
  description,
}) {
  const isRegister = mode === 'register'
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'

  return (
    <main className="auth-page">
      {/* =====================================================
          LEFT / VISUAL
      ====================================================== */}
      <aside className="auth-visual">
        <div className="auth-visual-content">
          <a
            href={en ? '/en' : '/'}
            className="auth-visual-brand"
            aria-label="NeoTek"
          >
            <img
              src="/assets/logo/logo_306x98_w.png"
              alt="NeoTek"
            />
          </a>

          <div className="auth-visual-copy">
            <span className="auth-visual-eyebrow">
              {en ? (isRegister ? 'Start with NeoTek' : 'Welcome back') : isRegister
                ? 'Bắt đầu cùng NeoTek'
                : 'Chào mừng trở lại'}
            </span>

            <p className="auth-visual-copy__title">
              {en ? 'Your NeoTek consultation account.' : isRegister
                ? 'Bắt đầu hành trình quản trị doanh nghiệp thông minh.'
                : 'Quản trị doanh nghiệp tập trung. Vận hành hiệu quả hơn.'}
            </p>

            <p>
              {en ? 'Sign in to request a consultation and view your appointments.' : isRegister
                ? 'Trải nghiệm hệ sinh thái giải pháp quản trị doanh nghiệp NeoTek và kết nối mọi hoạt động trên một nền tảng.'
                : 'Đăng nhập để tiếp tục sử dụng các giải pháp và dịch vụ quản trị doanh nghiệp của NeoTek.'}
            </p>
          </div>

          <div className="auth-visual-footer">
            <span>NEOTEK ENTERPRISE</span>
          </div>
        </div>
      </aside>

      {/* =====================================================
          RIGHT / FORM
      ====================================================== */}
      <section className="auth-content">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">

            <h1>{title}</h1>

            {description ? (
              <p>{description}</p>
            ) : null}
          </div>

          {children}
        </div>
      </section>
    </main>
  )
}
