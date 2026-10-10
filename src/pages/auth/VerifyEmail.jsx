import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from './AuthLayout'
import { safeReturn } from '../../customer/customerCopy'
import { customerApi } from '../../services/customer/customerApi'
import { useRuntimeToken } from '../../customer/useRuntimeToken'
import { useInlineValidation } from '../../components/forms/useInlineValidation'
import { fieldValidators } from '../../components/forms/fieldValidation'
import { FieldError } from '../../components/forms/FieldError'

const messages = {
  vi: {
    waiting: 'Xác minh email', verifying: 'Đang xác minh email…', success: 'Xác minh email thành công', invalid: 'Liên kết không hợp lệ hoặc đã hết hạn',
    intro: 'Nếu email khớp với tài khoản chưa xác minh, chúng tôi đã gửi liên kết xác minh đến địa chỉ bạn cung cấp.',
    guidance: 'Kiểm tra Hộp thư đến và Thư rác. Liên kết xác minh có hiệu lực trong 1 giờ.',
    resend: 'Gửi lại email xác minh', cooldown: seconds => `Gửi lại sau ${seconds} giây`, login: 'Quay lại đăng nhập', continue: 'Tiếp tục',
    successCopy: 'Email đã được xác minh. Bạn có thể đăng nhập để tiếp tục.', invalidCopy: 'Hãy yêu cầu một liên kết mới bằng email đăng ký.',
    unavailable: 'Chưa thể thực hiện yêu cầu. Vui lòng thử lại.', limited: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.', placeholder: 'Nhập email đăng ký', busy: 'Đang gửi…',
  },
  en: {
    waiting: 'Verify email', verifying: 'Verifying email…', success: 'Email verified successfully', invalid: 'This link is invalid or has expired',
    intro: 'If this email matches an unverified account, we have sent a verification link to the address you provided.',
    guidance: 'Check your Inbox and Spam folder. Verification links expire after 1 hour.',
    resend: 'Resend verification email', cooldown: seconds => `Resend in ${seconds} seconds`, login: 'Back to sign in', continue: 'Continue',
    successCopy: 'Your email is verified. Sign in to continue.', invalidCopy: 'Request a new link using your registration email.',
    unavailable: 'Unable to complete this request. Please try again.', limited: 'Too many requests. Please try again later.', placeholder: 'Enter registration email', busy: 'Sending…',
  },
}

export default function VerifyEmail() {
  const location = useLocation()
  return <VerificationPanel key={location.key} />
}

function VerificationPanel() {
  const { i18n } = useTranslation(), lang = i18n.language === 'en' ? 'en' : 'vi', copy = messages[lang], prefix = lang === 'en' ? '/en' : ''
  const location = useLocation(), [params] = useSearchParams()
  const target = safeReturn(params.get('returnTo'), lang)
  const token = useRuntimeToken(), started = useRef(false), pending = useRef(false)
  const [state, setState] = useState(token.current ? 'verifying' : 'waiting')
  const [email, setEmail] = useState(typeof location.state?.email === 'string' ? location.state.email : '')
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [until, setUntil] = useState(location.state?.sentAt ? location.state.sentAt + 60000 : 0)
  const [now, setNow] = useState(Date.now())
  const seconds = Math.max(0, Math.ceil((until - now) / 1000))
  const validation = useInlineValidation(values => ({ email: fieldValidators(lang).email(values.email) }))
  useEffect(() => {
    if (!seconds) return
    const timer = setTimeout(() => setNow(Date.now()), 1000)
    return () => clearTimeout(timer)
  }, [seconds])
  useEffect(() => {
    if (!token.current || started.current) return
    started.current = true
    const raw = token.current
    token.current = null
    customerApi.verify(raw).then(() => setState('success')).catch(err => {
      setState('invalid')
      if (err.status !== 400) setError(copy.unavailable)
    })
  }, [token, copy.unavailable])
  const resend = async event => {
    event.preventDefault()
    if (pending.current || seconds || !validation.validate(event.currentTarget)) return
    pending.current = true; setBusy(true); setError('')
    try {
      await customerApi.resend({ email: email.trim(), locale: lang })
      setState('waiting'); setNow(Date.now()); setUntil(Date.now() + 60000)
    } catch (err) {
      setError(err.status === 429 ? copy.limited : copy.unavailable)
      if (err.status === 429) { setNow(Date.now()); setUntil(Date.now() + 60000) }
    } finally { pending.current = false; setBusy(false) }
  }
  const login = `${prefix}/login?returnTo=${encodeURIComponent(target)}`
  return <AuthLayout title={copy[state]}>
    <div className="auth-verification-panel">
      <p role="status" aria-live="polite">{state === 'verifying' ? copy.verifying : state === 'success' ? copy.successCopy : state === 'invalid' ? copy.invalidCopy : copy.intro}</p>
      {error && <p className="auth-field-message" role="alert">{error}</p>}
      {state === 'success' ? <Link className="auth-submit auth-verification-continue" to={login}>{copy.continue}</Link> : state !== 'verifying' && <>
        <p className="auth-verification-guidance">{copy.guidance}</p>
        <form className="auth-form" noValidate {...validation.events} onSubmit={resend}>
          <label className="auth-field"><span className="auth-field-label">Email <span aria-hidden="true">*</span></span><input className="auth-input" name="email" type="email" autoComplete="email" required maxLength={254} placeholder={copy.placeholder} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} {...validation.field('email')} /><FieldError validation={validation} name="email" /></label>
          <button type="submit" className="auth-submit" disabled={busy || seconds > 0}>{busy ? copy.busy : seconds ? copy.cooldown(seconds) : copy.resend}</button>
        </form>
      </>}
      {state !== 'success' && <p className="auth-switch"><Link to={login}>{copy.login}</Link></p>}
    </div>
  </AuthLayout>
}
