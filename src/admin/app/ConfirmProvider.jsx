import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react'
import {AlertDialog} from 'radix-ui'

const ConfirmContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() { return useContext(ConfirmContext) }

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolver = useRef(null)
  const invoker = useRef(null)
  const confirm = useCallback((description, title = 'Xác nhận thay đổi') => new Promise(resolve => {
    if (resolver.current) { resolve(false); return }
    invoker.current = document.activeElement
    resolver.current = resolve
    setRequest({ description, title })
  }), [])
  const finish = useCallback(result => {
    resolver.current?.(result)
    resolver.current = null
    setRequest(null)
  }, [])
  useEffect(() => () => { resolver.current?.(false) }, [])
  return <ConfirmContext.Provider value={confirm}>{children}<AlertDialog.Root open={!!request} onOpenChange={open => { if (!open) finish(false) }}>
    <AlertDialog.Portal><AlertDialog.Overlay className="admin-confirm-overlay" /><AlertDialog.Content className="admin-confirm-content" onCloseAutoFocus={event => {
      event.preventDefault()
      if (invoker.current?.isConnected) invoker.current.focus()
      else document.querySelector('.admin-section-form button, .admin-main a, .admin-header button')?.focus()
    }}>
      <AlertDialog.Title>{request?.title}</AlertDialog.Title><AlertDialog.Description>{request?.description}</AlertDialog.Description>
      <div className="admin-form-actions"><AlertDialog.Cancel className="admin-button admin-button--ghost" onClick={() => finish(false)}>Hủy</AlertDialog.Cancel><AlertDialog.Action className="admin-button admin-button--primary" onClick={() => finish(true)}>Xác nhận</AlertDialog.Action></div>
    </AlertDialog.Content></AlertDialog.Portal>
  </AlertDialog.Root></ConfirmContext.Provider>
}
