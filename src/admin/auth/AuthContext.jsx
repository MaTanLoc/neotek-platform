import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi, AdminApiError } from '../../services/admin/adminApi'
import { AuthContext } from './context'

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)
  const [csrfToken, setCsrfToken] = useState(null)

  const restore = useCallback(async () => {
    try {
      const result = await adminApi.getCurrentUser()
      const csrf = await adminApi.getCsrfToken()
      setUser(result.user)
      setCsrfToken(csrf.csrfToken)
      setStatus('authenticated')
    } catch (error) {
      setUser(null)
      setCsrfToken(null)
      setStatus(error instanceof AdminApiError && error.status !== 401 ? 'unauthenticated' : 'unauthenticated')
    }
  }, [])

  useEffect(() => { restore() }, [restore])

  const login = useCallback(async (email, password) => {
    const result = await adminApi.login(email, password)
    const csrf = await adminApi.getCsrfToken()
    setUser(result.user)
    setCsrfToken(csrf.csrfToken)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try { await adminApi.logout(csrfToken) } finally {
      setUser(null)
      setCsrfToken(null)
      setStatus('unauthenticated')
    }
  }, [csrfToken])

  const clearAuth = useCallback(() => {
    setUser(null)
    setCsrfToken(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(() => ({
    status, user, csrfToken, login, logout,
    clearAuth,
    restore,
  }), [status, user, csrfToken, login, logout, clearAuth, restore])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
