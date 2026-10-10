import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from './AuthLayout'
import { useCustomer } from '../../customer/context'
import { authError, customerCopy, safeReturn } from '../../customer/customerCopy'
import { customerApi } from '../../services/customer/customerApi'
import { recoveryCopy } from '../../customer/recoveryCopy'
import GoogleSignInButton from '../../customer/GoogleSignInButton'
import { useInlineValidation } from '../../components/forms/useInlineValidation'
import { fieldValidators } from '../../components/forms/fieldValidation'
import { FieldError } from '../../components/forms/FieldError'
import { Eye, EyeOff } from 'lucide-react'

export default function CustomerAuthForm({ register = false }) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'vi', copy = customerCopy[lang], prefix = lang === 'en' ? '/en' : ''
  const [params] = useSearchParams(), navigate = useNavigate(), { customer, status, login, googleLogin } = useCustomer()
  const target = safeReturn(params.get('returnTo'), lang)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const pending = useRef(false)
  const rules = fieldValidators(lang)
  const validation = useInlineValidation(values => ({
    ...(register ? { name: rules.text(values.name, 120), phone: rules.phone(values.phone) } : {}),
    email: rules.email(values.email), password: rules.password(values.password),
    ...(register ? { confirm: rules.confirm(values.confirm, values.password) } : {}),
  }))
  const redirect = customer => navigate(customer.emailVerifiedAt ? target : `${prefix}/verify-email?returnTo=${encodeURIComponent(target)}`, { replace: true })
  const google = async credential => {
    if (pending.current) return
    pending.current = true; setBusy(true); setError('')
    try { const customer = await googleLogin(credential); if (customer) redirect(customer); else setError(copy.error) }
    catch { setError(lang === 'en' ? 'Google sign-in could not be completed. Try again or use email and password.' : 'Không thể đăng nhập Google. Vui lòng thử lại hoặc dùng email và mật khẩu.') }
    finally { pending.current = false; setBusy(false) }
  }
  const submit = async event => {
    event.preventDefault()
    if (pending.current) return
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (!validation.validate(event.currentTarget)) return
    pending.current = true; setBusy(true); setError('')
    try {
      if (register) { await customerApi.register({ email: data.email, name: data.name, phone: data.phone.trim(), password: data.password, locale: lang }); navigate(`${prefix}/verify-email?returnTo=${encodeURIComponent(target)}`, { state: { email: data.email.trim(), sentAt: Date.now() } }) }
      else { redirect(await login({ email: data.email, password: data.password })) }
    } catch (err) {
      if (!register && err.status === 403 && err.message === 'EMAIL_NOT_VERIFIED') navigate(`${prefix}/verify-email?returnTo=${encodeURIComponent(target)}`, { state: { email: data.email.trim() } })
      else setError(authError(err, copy))
    }
    finally { pending.current = false; setBusy(false) }
  }
  const query = `?returnTo=${encodeURIComponent(target)}`
  const en = lang === 'en'
  const description = en
    ? (register ? 'Sign up to experience NeoTek business management solutions.' : 'Sign in to continue using the NeoTek solutions ecosystem.')
    : (register ? 'Đăng ký để trải nghiệm các giải pháp quản trị doanh nghiệp của NeoTek.' : 'Đăng nhập để tiếp tục sử dụng hệ sinh thái giải pháp NeoTek.')
  const inputField = (name, label, placeholder, options = {}) => {
    const password = name === 'password' || name === 'confirm'
    const visible = name === 'confirm' ? showConfirm : show
    const toggle = name === 'confirm' ? setShowConfirm : setShow
    return <div className={`auth-field${register && name === 'email' ? ' auth-field-full' : ''}`} key={name}>
      <div className="auth-label-row">
        <label className="auth-field-label" htmlFor={`auth-${name}`}>{label} <span aria-hidden="true">*</span></label>
        {!register && password && <Link className="auth-forgot" to={`${prefix}/forgot-password`}>{recoveryCopy[lang].forgot}</Link>}
      </div>
      <div className={password ? 'auth-password' : undefined}>
        <input id={`auth-${name}`} className="auth-input" name={name} placeholder={placeholder} required {...options} type={password ? (visible ? 'text' : 'password') : options.type} {...validation.field(name)} />
        {password && <button className="auth-password-toggle" type="button" aria-label={en ? `${visible ? 'Hide' : 'Show'} ${name === 'confirm' ? 'confirmation password' : 'password'}` : `${visible ? 'Ẩn' : 'Hiện'} ${name === 'confirm' ? 'mật khẩu xác nhận' : 'mật khẩu'}`} aria-pressed={visible} onClick={() => toggle(!visible)}>{visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button>}
      </div>
      <FieldError validation={validation} name={name} />
    </div>
  }
  if (status === 'loading') return <AuthLayout title={register ? copy.register : copy.login}><p role="status">{copy.loading}</p></AuthLayout>
  if (customer) return <Navigate replace to={customer.emailVerifiedAt ? target : `${prefix}/verify-email?returnTo=${encodeURIComponent(target)}`} />
  return <AuthLayout mode={register ? 'register' : 'login'} title={register ? copy.register : copy.login} description={description}>
    <form className="auth-form auth-customer-form" noValidate {...validation.events} onSubmit={submit}>
      {error && <p role="alert">{error}</p>}
      <div className={register ? 'auth-form-grid' : 'auth-credentials'}>
        {register && inputField('name', copy.name, en ? 'Enter full name' : 'Nhập họ và tên', { maxLength: 120, autoComplete: 'name' })}
        {register && inputField('phone', en ? 'Phone number' : 'Số điện thoại', en ? 'Enter phone number' : 'Nhập số điện thoại', { type: 'tel', maxLength: 32, autoComplete: 'tel' })}
        {inputField('email', copy.email, en ? 'Enter email' : 'Nhập email', { type: 'email', maxLength: 254, autoComplete: 'email' })}
        {inputField('password', en ? 'Password' : 'Mật khẩu', en ? 'Enter password' : 'Nhập mật khẩu', { minLength: 12, maxLength: 256, autoComplete: register ? 'new-password' : 'current-password', title: copy.password })}
        {register && inputField('confirm', copy.confirm, en ? 'Re-enter password' : 'Nhập lại mật khẩu', { minLength: 12, maxLength: 256, autoComplete: 'new-password' })}
      </div>
      <button className="auth-submit" disabled={busy}>{busy ? copy.loading : register ? copy.register : copy.login}</button>
      <GoogleSignInButton lang={lang} register={register} busy={busy} onCredential={google} />
      <p className="auth-switch">{en ? (register ? 'Already have an account? ' : 'Don’t have an account? ') : (register ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? ')}<Link to={`${prefix}/${register ? 'login' : 'register'}${query}`}>{register ? copy.login : en ? 'Sign up now' : 'Đăng ký ngay'}</Link></p>
    </form>
  </AuthLayout>
}
