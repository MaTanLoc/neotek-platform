import {useLayoutEffect, useRef, useState} from 'react'

// Preserve public proportions in a bounded canvas; no iframe or extra fetch.
export function DraftPreviewPanel({ children, label, width = 1280 }) {
  const frame = useRef(null), canvas = useRef(null)
  const [size, setSize] = useState({ scale: 1, height: 700 })
  useLayoutEffect(() => {
    const measure = () => setSize({ scale: Math.min(1, frame.current.clientWidth / width), height: canvas.current.offsetHeight })
    const observer = new ResizeObserver(measure)
    observer.observe(frame.current); observer.observe(canvas.current); measure()
    return () => observer.disconnect()
  }, [width])
  return <div ref={frame} className="admin-draft-preview" aria-label={label} style={{ height: size.height * size.scale }} onClickCapture={event => { if (event.target.closest('a')) event.preventDefault() }}>
    <div ref={canvas} className="admin-draft-preview__canvas" style={{ width, transform: `scale(${size.scale})` }}>{children}</div>
  </div>
}
