import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  if (command === 'build') {
    const base = env.VITE_API_BASE_URL?.trim()
    let valid = base === '/api'
    try {
      const url = new URL(base)
      valid = url.protocol === 'https:' && !url.username && !url.password &&
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.search && !url.hash
    } catch { /* Only the explicit same-origin /api form is accepted. */ }
    if (!valid) throw new Error('Production VITE_API_BASE_URL must be an HTTPS API URL or /api; localhost is development-only')
  }
  return { plugins: [react()], build: { sourcemap: false } }
})
