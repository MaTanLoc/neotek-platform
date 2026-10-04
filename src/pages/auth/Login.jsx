import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import * as Form from '@radix-ui/react-form'
import AuthLayout from './AuthLayout'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    console.log('Login submitted', {
      email: formData.get('email'),
      password: formData.get('password'),
      remember,
    })
  }

  return (
    <AuthLayout
      mode="login"
      title="Đăng nhập"
      description="Đăng nhập để tiếp tục sử dụng hệ sinh thái giải pháp NeoTek."
    >
      <Form.Root
        className="auth-form"
        onSubmit={handleSubmit}
      >
        {/* EMAIL */}
        <Form.Field
          className="auth-field"
          name="email"
        >
          <div className="auth-field-header">
            <Form.Label className="auth-field-label">
              Email <span>*</span>
            </Form.Label>
          </div>

          <Form.Control asChild>
            <input
              className="auth-input"
              type="email"
              placeholder="Nhập email"
              autoComplete="email"
              required
            />
          </Form.Control>

          <Form.Message
            className="auth-field-message"
            match="valueMissing"
          >
            Vui lòng nhập email.
          </Form.Message>

          <Form.Message
            className="auth-field-message"
            match="typeMismatch"
          >
            Email không hợp lệ.
          </Form.Message>
        </Form.Field>

        {/* PASSWORD */}
        <Form.Field
          className="auth-field"
          name="password"
        >
          <div className="auth-label-row">
            <Form.Label className="auth-field-label">
              Mật khẩu <span>*</span>
            </Form.Label>

            <a
              href="/forgot-password"
              className="auth-forgot"
            >
              Quên mật khẩu?
            </a>
          </div>

          <div className="auth-password">
            <Form.Control asChild>
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                required
              />
            </Form.Control>

            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Form.Message
            className="auth-field-message"
            match="valueMissing"
          >
            Vui lòng nhập mật khẩu.
          </Form.Message>
        </Form.Field>

        {/* REMEMBER */}
        <label className="auth-checkbox">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(event) =>
              setRemember(event.target.checked)
            }
          />

          <span>Ghi nhớ đăng nhập</span>
        </label>

        {/* SUBMIT */}
        <Form.Submit asChild>
          <button
            type="submit"
            className="auth-submit"
          >
            Đăng nhập
          </button>
        </Form.Submit>

        {/* DIVIDER */}
        <div
          className="auth-divider"
          aria-hidden="true"
        >
          <span />
          <small>hoặc</small>
          <span />
        </div>

        {/* SOCIAL */}
        <div className="auth-socials">
          <button
            type="button"
            className="auth-social"
          >
            <span className="auth-social-icon">
              G
            </span>

            Google
          </button>

          <button
            type="button"
            className="auth-social"
          >
            <span className="auth-social-icon">
              in
            </span>

            Microsoft
          </button>
        </div>

        {/* REGISTER */}
        <p className="auth-switch">
          Chưa có tài khoản?

          <a href="/register">
            {' '}Đăng ký ngay
          </a>
        </p>
      </Form.Root>
    </AuthLayout>
  )
}