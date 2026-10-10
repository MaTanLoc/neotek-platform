import { httpRequest } from '../http'

let csrfToken = null
let csrfRequest = null
async function mutation(path, body, options = {}) {
  if (!csrfToken) {
    csrfRequest ||= httpRequest('/customer-auth/csrf').finally(() => { csrfRequest = null })
    csrfToken = (await csrfRequest).csrfToken
  }
  try { return await httpRequest(path, { method: 'POST', body, csrfToken, ...options }) }
  catch (error) { if (error.status === 401 || (error.status === 403 && error.message === 'Invalid CSRF token')) csrfToken = null; throw error }
}
export const customerApi = {
  me: () => httpRequest('/customer-auth/me'),
  login: async body => { const result = await httpRequest('/customer-auth/login', { method: 'POST', body }); csrfToken = null; return result },
  googleLogin: async credential => { const result = await httpRequest('/customer-auth/google', { method: 'POST', body: { credential } }); csrfToken = null; return result },
  register: body => httpRequest('/customer-auth/register', { method: 'POST', body }),
  forgotPassword: body => httpRequest('/customer-auth/forgot-password', { method: 'POST', body }),
  resetPassword: async body => { const result = await httpRequest('/customer-auth/reset-password', { method: 'POST', body }); csrfToken = null; return result },
  verify: token => httpRequest('/customer-auth/verify-email', { method: 'POST', body: { token } }),
  resend: body => httpRequest('/customer-auth/resend-verification', { method: 'POST', body }),
  logout: async () => { await mutation('/customer-auth/logout'); csrfToken = null },
  options: () => httpRequest('/booking/options'),
  availability: (from, to, duration, signal) => httpRequest(`/booking/availability?${new URLSearchParams({ from, to, duration })}`, { signal }),
  currentHold: () => httpRequest('/booking/hold'),
  acquire: body => mutation('/booking/hold', body),
  release: (id, keepalive = false) => mutation(`/booking/holds/${encodeURIComponent(id)}/release`, undefined, { keepalive }),
  finalize: body => mutation('/booking/finalize', body),
  bookings: (page = 1, period = 'upcoming', range = {}, signal) => httpRequest(`/booking/mine?${new URLSearchParams({ page, ...(period ? { period } : {}), ...range })}`, { signal }),
}
