import { useCallback, useEffect, useState } from 'react'
import { customerApi } from '../services/customer/customerApi'
import { CustomerContext } from './context'

export default function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [status, setStatus] = useState('loading')
  const restore = useCallback(async () => {
    try { const result = await customerApi.me(); setCustomer(result.customer); setStatus('ready'); return result.customer }
    catch (error) { setCustomer(null); setStatus(error.status === 401 ? 'ready' : 'error'); if (error.status !== 401) throw error; return null }
  }, [])
  useEffect(() => { restore().catch(() => {}) }, [restore])
  useEffect(() => { const refresh = () => restore().catch(() => {}); window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh) }, [restore])
  const login = async body => { const result = await customerApi.login(body); setCustomer(result.customer); setStatus('ready'); return result.customer }
  const logout = async () => { await customerApi.logout(); setCustomer(null); setStatus('ready') }
  return <CustomerContext.Provider value={{ customer, status, restore, login, logout }}>{children}</CustomerContext.Provider>
}
