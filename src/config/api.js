const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()
if (import.meta.env.PROD && !configuredBase) throw new Error('VITE_API_BASE_URL is required for production')
export const API_BASE_URL = (configuredBase || (import.meta.env.DEV ? 'http://localhost:3000/api' : '')).replace(/\/+$/, '')
