import { useState } from 'react'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import * as Form from '@radix-ui/react-form'
import * as Select from '@radix-ui/react-select'
import * as Checkbox from '@radix-ui/react-checkbox'
import AuthLayout from './AuthLayout'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!termsAccepted) {
      return
    }

    // Public customer auth remains disabled until its service exists.

  }

  return (
    <AuthLayout
      mode="register"
      title="Tạo tài khoản"
      description="Đăng ký để trải nghiệm các giải pháp quản trị doanh nghiệp của NeoTek."
    >
      <Form.Root
        className="auth-form auth-register-form"
        onSubmit={handleSubmit}
      >
        {/* =================================================
            ACCOUNT
        ================================================== */}

        <div className="auth-form-section-title">
          Thông tin tài khoản
        </div>

        <div className="auth-form-grid">
          {/* HỌ VÀ TÊN */}
          <Form.Field
            className="auth-field"
            name="fullName"
          >
            <Form.Label className="auth-field-label">
              Họ và tên <span>*</span>
            </Form.Label>

            <Form.Control asChild>
              <input
                className="auth-input"
                type="text"
                placeholder="Nhập họ và tên"
                autoComplete="name"
                required
              />
            </Form.Control>

            <Form.Message
              className="auth-field-message"
              match="valueMissing"
            >
              Vui lòng nhập họ và tên.
            </Form.Message>
          </Form.Field>

          {/* PHONE */}
          <Form.Field
            className="auth-field"
            name="phone"
          >
            <Form.Label className="auth-field-label">
              Số điện thoại <span>*</span>
            </Form.Label>

            <Form.Control asChild>
              <input
                className="auth-input"
                type="tel"
                placeholder="Nhập số điện thoại"
                autoComplete="tel"
                required
              />
            </Form.Control>

            <Form.Message
              className="auth-field-message"
              match="valueMissing"
            >
              Vui lòng nhập số điện thoại.
            </Form.Message>
          </Form.Field>

          {/* EMAIL */}
          <Form.Field
            className="auth-field auth-field-full"
            name="email"
          >
            <Form.Label className="auth-field-label">
              Email <span>*</span>
            </Form.Label>

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
            <Form.Label className="auth-field-label">
              Mật khẩu
            </Form.Label>

            <div className="auth-password">
              <Form.Control asChild>
                <input
                  className="auth-input"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Nhập mật khẩu"
                  autoComplete="new-password"
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
          </Form.Field>

          {/* CONFIRM PASSWORD */}
          <Form.Field
            className="auth-field"
            name="passwordConfirm"
          >
            <Form.Label className="auth-field-label">
              Xác nhận mật khẩu
            </Form.Label>

            <div className="auth-password">
              <Form.Control asChild>
                <input
                  className="auth-input"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                />
              </Form.Control>

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPasswordConfirm((value) => !value)}
                aria-label={showPasswordConfirm ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Form.Field>
        </div>

        {/* =================================================
            COMPANY
        ================================================== */}

        <div className="auth-form-section-title auth-section-spaced">
          <span className="auth-section-title-main">
            Thông tin doanh nghiệp
          </span>

          <span>Không bắt buộc</span>
        </div>

        <div className="auth-form-grid">
          {/* COMPANY */}
          <Form.Field
            className="auth-field"
            name="company"
          >
            <Form.Label className="auth-field-label">
              Tên công ty
            </Form.Label>

            <Form.Control asChild>
              <input
                className="auth-input"
                type="text"
                placeholder="Nhập tên công ty"
                autoComplete="organization"
              />
            </Form.Control>
          </Form.Field>

          {/* TAX */}
          <Form.Field
            className="auth-field"
            name="taxCode"
          >
            <Form.Label className="auth-field-label">
              CCCD / Mã số thuế
            </Form.Label>

            <Form.Control asChild>
              <input
                className="auth-input"
                type="text"
                placeholder="Nhập CCCD / mã số thuế"
              />
            </Form.Control>
          </Form.Field>

          {/* PRODUCT */}
          <Form.Field
            className="auth-field"
            name="product"
          >
            <Form.Label className="auth-field-label">
              Sản phẩm quan tâm
            </Form.Label>

            <Select.Root name="product">
              <Select.Trigger
                className="auth-select-trigger"
                aria-label="Sản phẩm quan tâm"
              >
                <Select.Value placeholder="Chọn sản phẩm" />

                <Select.Icon>
                  <Select.Icon>
                    <ChevronDown size={16} strokeWidth={1.8} />
                  </Select.Icon>
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content
                  className="auth-select-content"
                  position="popper"
                  sideOffset={6}
                >
                  <Select.Viewport className="auth-select-viewport">
                    <Select.Item
                      value="neoerp"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        NeoERP
                      </Select.ItemText>
                    </Select.Item>

                    <Select.Item
                      value="crm"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        CRM
                      </Select.ItemText>
                    </Select.Item>

                    <Select.Item
                      value="sales"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        Quản trị bán hàng
                      </Select.ItemText>
                    </Select.Item>

                    <Select.Item
                      value="hrm"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        Quản trị nhân sự
                      </Select.ItemText>
                    </Select.Item>

                    <Select.Item
                      value="other"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        Giải pháp khác
                      </Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </Form.Field>

          {/* POSITION */}
          <Form.Field
            className="auth-field"
            name="position"
          >
            <Form.Label className="auth-field-label">
              Vị trí công việc
            </Form.Label>

            <Select.Root name="position">
              <Select.Trigger
                className="auth-select-trigger"
                aria-label="Vị trí công việc"
              >
                <Select.Value placeholder="Chọn vị trí" />

                <Select.Icon>
                  <Select.Icon>
                    <ChevronDown size={16} strokeWidth={1.8} />
                  </Select.Icon>
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content
                  className="auth-select-content"
                  position="popper"
                  sideOffset={6}
                >
                  <Select.Viewport className="auth-select-viewport">
                    <Select.Item
                      value="owner"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        Chủ doanh nghiệp
                      </Select.ItemText>
                    </Select.Item>

                    <Select.Item
                      value="director"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        Ban giám đốc
                      </Select.ItemText>
                    </Select.Item>

                    <Select.Item
                      value="manager"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        Quản lý
                      </Select.ItemText>
                    </Select.Item>

                    <Select.Item
                      value="employee"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        Nhân viên
                      </Select.ItemText>
                    </Select.Item>

                    <Select.Item
                      value="other"
                      className="auth-select-item"
                    >
                      <Select.ItemText>
                        Khác
                      </Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </Form.Field>
        </div>

        {/* =================================================
            TERMS
        ================================================== */}

        <div className="auth-terms-row">
          <Checkbox.Root
            id="register-terms"
            className="auth-checkbox-control"
            checked={termsAccepted}
            onCheckedChange={(checked) =>
              setTermsAccepted(checked === true)
            }
          >
            <Checkbox.Indicator className="auth-checkbox-indicator">
              ✓
            </Checkbox.Indicator>
          </Checkbox.Root>

          <label
            htmlFor="register-terms"
            className="auth-terms-text"
          >
            Tôi đồng ý với{' '}
            <a href="/terms">
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href="/privacy">
              Chính sách bảo mật
            </a>{' '}
            của NeoTek.
          </label>
        </div>

        {/* SUBMIT */}
        <Form.Submit asChild>
          <button
            type="submit"
            className="auth-submit"
            disabled={!termsAccepted}
          >
            Tạo tài khoản
          </button>
        </Form.Submit>

        {/* LOGIN */}
        <p className="auth-switch">
          Đã có tài khoản?

          <a href="/login">
            {' '}Đăng nhập
          </a>
        </p>
      </Form.Root>
    </AuthLayout>
  )
}