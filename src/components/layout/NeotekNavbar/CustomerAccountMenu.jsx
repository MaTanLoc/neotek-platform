import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DropdownMenu } from 'radix-ui'
import { ChevronDown } from 'lucide-react'
import { useCustomer } from '../../../customer/context'
import { customerCopy, safeReturn } from '../../../customer/customerCopy'
import { customerInitial } from './customerInitial'

export default function CustomerAccountMenu({ language, mobile = false, beforeLogout }) {
  const { customer, status, logout } = useCustomer()
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const loginRef = useRef(null), focusLogin = useRef(false)
  useEffect(() => {
    if (!customer && focusLogin.current) {
      focusLogin.current = false
      const frame = requestAnimationFrame(() => loginRef.current?.focus({ preventScroll: true }))
      return () => cancelAnimationFrame(frame)
    }
  }, [customer])
  const prefix = language === 'en' ? '/en' : '', copy = customerCopy[language]
  if (status === 'loading') return <span className="neotek-navbar__auth-placeholder" aria-busy="true" />
  if (!customer) return <Link ref={loginRef} className={`neotek-navbar__login${mobile ? ' neotek-navbar__login--mobile' : ''}`} to={`${prefix}/login?returnTo=${encodeURIComponent(safeReturn(window.location.pathname, language))}`}>{copy.login}</Link>
  const signOut = async event => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      if (beforeLogout && !await beforeLogout()) { setError(copy.releaseError); return }
      focusLogin.current = true; await logout(); setOpen(false)
    } catch { focusLogin.current = false; setError(copy.unavailable) }
    finally { setBusy(false) }
  }
  return <DropdownMenu.Root open={open} onOpenChange={setOpen}>
    <DropdownMenu.Trigger className="neotek-navbar__account" aria-label={language === 'en' ? 'Customer account' : 'Tài khoản khách hàng'}>
      <span className="neotek-navbar__avatar" aria-hidden="true">{customerInitial(customer)}</span><ChevronDown size={14} aria-hidden="true" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content className="neotek-account-menu" align="end" sideOffset={8}>
      <DropdownMenu.Label className="neotek-account-menu__header"><strong>{customer.name}</strong><span>{customer.email}</span></DropdownMenu.Label>
      <DropdownMenu.Item asChild><Link className="neotek-account-menu__item" to={`${prefix}/account/bookings`}>{copy.bookings}</Link></DropdownMenu.Item>
      <DropdownMenu.Separator className="neotek-account-menu__separator" />
      <DropdownMenu.Item className="neotek-account-menu__item" disabled={busy} onSelect={signOut}>{busy ? copy.loading : copy.logout}</DropdownMenu.Item>
      {error && <p className="neotek-account-menu__error" role="alert">{error}</p>}
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>
}
