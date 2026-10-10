import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CustomerContext } from '../../src/customer/context'
import { customerCopy } from '../../src/customer/customerCopy'
import { AuthContext } from '../../src/admin/auth/context'
import { AdminLogin } from '../../src/admin/pages/AdminLogin'
import '../../src/admin/styles/admin.css'
import CustomerAuthForm from '../../src/pages/auth/CustomerAuthForm'
import PasswordRecovery from '../../src/pages/auth/PasswordRecovery'
import VerifyEmail from '../../src/pages/auth/VerifyEmail'
import BookingDialog from '../../src/pages/booking/BookingDialog'
import i18n from '../../src/i18n'
import '../../src/styles/neotek-tokens.css'
import '../../src/styles/neotek-global.css'
import '../../src/pages/booking/BookingPage.css'

// Render actual production forms with only their external API/context boundary
// replaced. No backend, Google, customer account or persisted booking is used.
const query = new URLSearchParams(window.location.search), mode = query.get('form'), language = query.get('lang') || 'vi'
await i18n.changeLanguage(language)
window.__submissions = 0
window.__calls = []
window.fetch = async (url, options) => {
  window.__submissions++; window.__lastBody = options?.body ? JSON.parse(options.body) : null
  window.__calls.push({ url, body: window.__lastBody })
  if (url.endsWith('/verify-email') && query.get('scenario') === 'hold') await new Promise(resolve => { window.__resolveVerification = resolve })
  const invalid = url.endsWith('/verify-email') && query.get('scenario') === 'invalid'
  return new Response(JSON.stringify(invalid ? { message: 'private backend error' } : {}), { status: invalid ? 400 : 200, headers: { 'Content-Type': 'application/json' } })
}
const customer = { email: 'customer@example.test', name: '', emailVerifiedAt: '2026-10-10' }
const context = { customer: null, status: 'anonymous', login: async () => { window.__submissions++; throw Object.assign(new Error(query.get('scenario') === 'unverified' ? 'EMAIL_NOT_VERIFIED' : 'Mock API rejection'), query.get('scenario') === 'unverified' ? { status: 403 } : {}) }, restore: async () => {}, googleLogin: async () => { throw new Error('Google is outside validation test scope') } }

export default function BookingFixture() {
  const [moduleKey, setModuleKey] = useState(''), returnFocusRef = useRef(null)
  const flow = { customer: mode === 'booking-guest' ? null : customer, moduleKey, setModuleKey, busy: false, status: 'ready', copy: customerCopy[language], options: { modules: [{ key: 'erp', vi: 'ERP', en: 'ERP' }] }, saveIntent: () => {}, setError: () => {} }
  return <BookingDialog open slot={{ date: '2026-10-12', startMinutes: 540, endMinutes: 570 }} submitState="idle" onSubmit={() => { window.__submissions++ }} onClose={() => {}} onBookAnother={() => {}} onChangeTime={() => {}} returnFocusRef={returnFocusRef} homePath="/" t={i18n.t.bind(i18n)} language={language} flow={flow} matchesHold={false} />
}

const form = mode === 'admin' ? <AdminLogin /> : mode.startsWith('booking') ? <BookingFixture /> : mode === 'verify' ? <VerifyEmail /> : mode === 'forgot' || mode === 'reset' ? <PasswordRecovery reset={mode === 'reset'} /> : <CustomerAuthForm register={mode === 'register'} />
createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><CustomerContext.Provider value={context}><AuthContext.Provider value={{ login: context.login }}>
  <Routes><Route path="/__validation-test" element={form} /><Route path="/verify-email" element={<VerifyEmail />} /><Route path="/en/verify-email" element={<VerifyEmail />} /></Routes>
</AuthContext.Provider></CustomerContext.Provider></BrowserRouter></StrictMode>)
