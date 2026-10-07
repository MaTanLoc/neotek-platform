import {useCallback, useContext, useEffect, useRef, useState} from 'react'
import {UNSAFE_NavigationContext} from 'react-router-dom'

import {useConfirm} from './ConfirmProvider'
import {CmsContext} from './cmsContext'
const warning = 'Bạn có thay đổi chưa lưu. Bạn muốn bỏ các thay đổi này để tiếp tục?'

// Register before BrowserRouter subscribes. A cancelled Back/Forward event must
// never reach the router, otherwise a transient route can reset editor drafts.
let activePopHandler = null
const interceptPop = event => activePopHandler?.(event)
window.addEventListener('popstate', interceptPop, true)
if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('popstate', interceptPop, true))

export function CmsProvider({ children }) {
  const [locale, setLocale] = useState('vi')
  const [bilingual, setBilingual] = useState(false)
  const confirm = useConfirm()
  const dirty = useRef(false)
  const { navigator } = useContext(UNSAFE_NavigationContext)
  const confirmLeave = useCallback(async () => !dirty.current || await confirm(warning), [confirm])
  const changeLocale = useCallback(async next => {
    if (next === locale || !await confirmLeave()) return
    dirty.current = false
    setLocale(next)
  }, [locale, confirmLeave])

  useEffect(() => {
    const originals = { push: navigator.push, replace: navigator.replace, go: navigator.go }
    let index = window.history.state?.idx ?? 0
    let restoring = false
    let restored = null
    const pop = event => {
      const next = window.history.state?.idx ?? 0
      if (restoring) { restoring = false; event.stopImmediatePropagation(); restored?.(); restored = null; return }
      if (!dirty.current) { index = next; return }
      event.stopImmediatePropagation()
      const delta = next - index
      if (!delta) return
      restoring = true
      const restoration = new Promise(resolve => { restored = resolve })
      window.history.go(-delta)
      void Promise.all([confirmLeave(), restoration]).then(([accepted]) => {
        if (accepted) { dirty.current = false; window.history.go(delta) }
      })
    }
    const remember = () => { index = window.history.state?.idx ?? index }
    const unload = event => {
      if (dirty.current) { event.preventDefault(); event.returnValue = '' }
    }
    activePopHandler = pop
    window.addEventListener('beforeunload', unload)
    // Record the current history position after a router push/replace.
    for (const method of ['push', 'replace', 'go']) {
      navigator[method] = (...args) => {
        const proceed = () => { dirty.current = false; const result = originals[method].apply(navigator, args); remember(); return result }
        if (!dirty.current) return proceed()
        void confirmLeave().then(accepted => { if (accepted) proceed() })
      }
    }
    return () => {
      Object.assign(navigator, originals)
      activePopHandler = null
      window.removeEventListener('beforeunload', unload)
    }
  }, [navigator, confirmLeave])

  return <CmsContext.Provider value={{ locale, changeLocale, dirty, confirmLeave, bilingual, setBilingual }}>{children}</CmsContext.Provider>
}
