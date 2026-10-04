import './neotek-auth.css'

export default function AuthLayout({
  children,
  mode = 'login',
  title,
  description,
}) {
  const isRegister = mode === 'register'

  return (
    <main className="auth-page">
      {/* =====================================================
          LEFT / VISUAL
      ====================================================== */}
      <aside className="auth-visual">
        <div className="auth-visual-content">
          <a
            href="/"
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
              {isRegister
                ? 'Bắt đầu cùng NeoTek'
                : 'Chào mừng trở lại'}
            </span>

            <p className="auth-visual-copy__title">
              {isRegister
                ? 'Bắt đầu hành trình quản trị doanh nghiệp thông minh.'
                : 'Quản trị doanh nghiệp tập trung. Vận hành hiệu quả hơn.'}
            </p>

            <p>
              {isRegister
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