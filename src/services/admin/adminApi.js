import { API_BASE_URL } from '../../config/api'

export class AdminApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
    this.details = details
  }
}

function errorMessage(status, payload) {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 409) return 'This value already exists.'
  if (status === 429) return 'Too many attempts. Please wait and try again.'
  if (status >= 500) return 'The server is unavailable. Please try again later.'
  if (payload?.message) return Array.isArray(payload.message) ? payload.message.join(', ') : payload.message
  return status === 400 ? 'Invalid input.' : 'Request failed.'
}

async function request(path, { method = 'GET', body, csrfToken } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await response.text()
  let payload
  try { payload = text ? JSON.parse(text) : null } catch { payload = null }
  if (!response.ok) throw new AdminApiError(response.status, errorMessage(response.status, payload), payload)
  return payload
}

export const adminApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  getCurrentUser: () => request('/auth/me'),
  getCsrfToken: () => request('/auth/csrf'),
  logout: (csrfToken) => request('/auth/logout', { method: 'POST', csrfToken }),
  getPages: () => request('/admin/pages'),
  getPage: (slug) => request(`/admin/pages/${encodeURIComponent(slug)}`),
  createPage: (body, csrfToken) => request('/admin/pages', { method: 'POST', body, csrfToken }),
  updatePage: (id, body, csrfToken) => request(`/admin/pages/${id}`, { method: 'PATCH', body, csrfToken }),
  updatePageTranslation: (id, locale, body, csrfToken) => request(`/admin/pages/${id}/translations/${locale}`, { method: 'PATCH', body, csrfToken }),
  createSection: (pageId, body, csrfToken) => request(`/admin/pages/${pageId}/sections`, { method: 'POST', body, csrfToken }),
  updateSection: (id, body, csrfToken) => request(`/admin/sections/${id}`, { method: 'PATCH', body, csrfToken }),
  updateSectionTranslation: (id, locale, body, csrfToken) => request(`/admin/sections/${id}/translations/${locale}`, { method: 'PUT', body, csrfToken }),
  reorderSections: (pageId, sections, csrfToken) => request(`/admin/pages/${pageId}/sections/order`, { method: 'PUT', body: { sections }, csrfToken }),
}
