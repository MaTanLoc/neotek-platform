import { useEffect, useRef, useState } from 'react'
import { GOOGLE_LOGIN } from '../config/features'

let scriptPromise, initialized = false, sequence = 0
const callbacks = new Map()
function loadGIS() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    const timer = setTimeout(() => { script.remove(); reject(new Error('GIS unavailable')) }, 10000)
    script.onload = () => { clearTimeout(timer); window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('GIS unavailable')) }
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('GIS unavailable')) }
    document.head.appendChild(script)
  }).catch(error => { scriptPromise = null; throw error })
  return scriptPromise
}

export default function GoogleSignInButton({ lang, register, busy, onCredential }) {
  const container = useRef(null), callback = useRef(onCredential)
  const [status, setStatus] = useState('loading')
  useEffect(() => { callback.current = onCredential }, [onCredential])
  useEffect(() => {
    if (!GOOGLE_LOGIN.enabled) return
    let alive = true
    const element = container.current
    const state = `neotek-google-${register ? 'register' : 'login'}-${++sequence}`
    callbacks.set(state, credential => callback.current(credential))
    loadGIS().then(gis => {
      if (!alive) return
      if (!initialized) {
        gis.initialize({ client_id: GOOGLE_LOGIN.clientId, auto_select: false, ux_mode: 'popup', callback: response => {
          if (typeof response.credential === 'string') callbacks.get(response.state)?.(response.credential)
        } })
        initialized = true
      }
      gis.renderButton(element, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', locale: lang, state, width: Math.min(360, element.clientWidth) })
      setStatus('ready')
    }).catch(() => { if (alive) setStatus('error') })
    return () => { alive = false; callbacks.delete(state); element?.replaceChildren() }
  }, [lang, register])
  if (!GOOGLE_LOGIN.enabled) return null
  return <div className="auth-google">
    <p className="auth-google-divider">{lang === 'en' ? 'or' : 'hoặc'}</p>
    <div ref={container} inert={busy ? '' : undefined} aria-busy={busy} />
    {status !== 'ready' && <p role="status">{status === 'loading' ? (lang === 'en' ? 'Loading Google sign-in…' : 'Đang tải đăng nhập Google…') : (lang === 'en' ? 'Google is unavailable. Please use email and password.' : 'Google chưa khả dụng. Vui lòng dùng email và mật khẩu.')}</p>}
  </div>
}
