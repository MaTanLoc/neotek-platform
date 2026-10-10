import { httpRequest } from '../http'

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

  if (payload?.message) {
    return Array.isArray(payload.message)
      ? payload.message.join(', ')
      : payload.message
  }

  return status === 400 ? 'Invalid input.' : 'Request failed.'
}

async function request(
  path,
  {
    method = 'GET',
    body,
    csrfToken,
    signal,
  } = {},
) {
  try { return await httpRequest(path, { method, body, csrfToken, signal }) }
  catch (error) {
    if (!error.status) throw error
    throw new AdminApiError(error.status, errorMessage(error.status, error.payload), error.payload)
  }
}

export const adminApi = {
  getGoogleCalendar: () => request('/admin/integrations/google/calendar'),
  connectGoogleCalendar: csrfToken => request('/admin/integrations/google/calendar/connect', { method: 'POST', csrfToken }),
  createGoogleMeet: (id, csrfToken) => request('/admin/bookings/' + encodeURIComponent(id) + '/google-meet', { method: 'POST', csrfToken }),
  listBookings: query => request('/admin/bookings?' + new URLSearchParams(query)),
  getBooking: id => request('/admin/bookings/' + encodeURIComponent(id)),
  transitionBooking: (id, body, csrfToken) => request('/admin/bookings/' + encodeURIComponent(id) + '/status', { method: 'POST', body, csrfToken }),
  addBookingNote: (id, text, csrfToken) => request('/admin/bookings/' + encodeURIComponent(id) + '/notes', { method: 'POST', body: { text }, csrfToken }),
  listSolutionDetails: () => request('/admin/solutions'),
  getSolutionDetail: slug => request(`/admin/solutions/${encodeURIComponent(slug)}`),
  createSolutionDetail: (moduleKey, csrfToken) => request('/admin/solutions', { method: 'POST', body: { moduleKey }, csrfToken }),
  saveSolutionDetail: (id, body, csrfToken) => request(`/admin/solutions/${id}`, { method: 'PUT', body, csrfToken }),
  getUploadSignature: (csrfToken, signal) =>
    request('/admin/media/upload-signature', {
      method: 'POST',
      csrfToken,
      signal,
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: {
        email,
        password,
      },
    }),

  getCurrentUser: () =>
    request('/auth/me'),

  getCsrfToken: () =>
    request('/auth/csrf'),

  logout: (csrfToken) =>
    request('/auth/logout', {
      method: 'POST',
      csrfToken,
    }),

  getPages: () =>
    request('/admin/pages'),

  getPage: (slug) =>
    request(`/admin/pages/${encodeURIComponent(slug)}`),

  createPage: (body, csrfToken) =>
    request('/admin/pages', {
      method: 'POST',
      body,
      csrfToken,
    }),

  updatePage: (id, body, csrfToken) =>
    request(`/admin/pages/${id}`, {
      method: 'PATCH',
      body,
      csrfToken,
    }),

  updatePageTranslation: (id, locale, body, csrfToken) =>
    request(
      `/admin/pages/${id}/translations/${locale}`,
      {
        method: 'PATCH',
        body,
        csrfToken,
      },
    ),

  createSection: (pageId, body, csrfToken) =>
    request(
      `/admin/pages/${pageId}/sections`,
      {
        method: 'POST',
        body,
        csrfToken,
      },
    ),

  updateSection: (id, body, csrfToken) =>
    request(`/admin/sections/${id}`, {
      method: 'PATCH',
      body,
      csrfToken,
    }),

  updateSectionTranslation: (
    id,
    locale,
    body,
    csrfToken,
  ) =>
    request(
      `/admin/sections/${id}/translations/${locale}`,
      {
        method: 'PUT',
        body,
        csrfToken,
      },
    ),

  // Lưu VI + EN cùng lúc.
  // Dùng cho các thay đổi cấu trúc song ngữ,
  // ví dụ thêm/xóa Hero slide.
  updateSectionTranslations: (
    id,
    body,
    csrfToken,
  ) =>
    request(
      `/admin/sections/${id}/translations`,
      {
        method: 'PUT',
        body,
        csrfToken,
      },
    ),

  reorderSections: (
    pageId,
    sections,
    csrfToken,
  ) =>
    request(
      `/admin/pages/${pageId}/sections/order`,
      {
        method: 'PUT',
        body: {
          sections,
        },
        csrfToken,
      },
    ),
}
