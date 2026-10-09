import { API_BASE_URL } from '../config/api'

export class ApiError extends Error {
  constructor(status, payload) { super(typeof payload?.message === 'string' ? payload.message : 'Request failed'); this.status = status; this.payload = payload }
}
export async function httpRequest(path, { method = 'GET', body, csrfToken, signal, keepalive = false } = {}) {
  const controller = new AbortController()
  const abort = () => controller.abort(signal?.reason)
  if (signal?.aborted) abort()
  else signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
  const response = await fetch(`${API_BASE_URL}${path}`, { method, credentials: 'include', signal: controller.signal, keepalive,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  let payload = null
  try { payload = await response.json() } catch {
    if (response.ok && response.status !== 204) throw new ApiError(502, { message: 'Invalid server response' })
  }
  if (!response.ok) throw new ApiError(response.status, payload)
  return payload
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}
