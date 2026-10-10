import { useEffect, useRef } from 'react'

// Capture once before effects run (including StrictMode's effect replay).
// Keep bearer secrets out of browser storage and the visible URL.
export function useRuntimeToken() {
  const token = useRef(new URLSearchParams(window.location.hash.slice(1)).get('token'))
  useEffect(() => {
    if (new URLSearchParams(window.location.hash.slice(1)).has('token')) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    }
  }, [])
  return token
}
