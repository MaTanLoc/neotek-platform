import {useState, useRef} from 'react'
import {Dialog} from 'radix-ui'
import {ImagePlus, X} from 'lucide-react'
import {MediaField} from './MediaField'

export function PortraitEditorDialog({ item, onChange, disabled }) {
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const style = { objectPosition: `${item.focalX ?? 50}% ${item.focalY ?? 50}%`, transformOrigin: `${item.focalX ?? 50}% ${item.focalY ?? 50}%`, transform: `scale(${item.zoom ?? 1})` }
  return <Dialog.Root open={draft !== null} onOpenChange={open => { if (open) setDraft({ image: item.image || '', focalX: item.focalX ?? 50, focalY: item.focalY ?? 50, zoom: item.zoom ?? 1 }); else { setDraft(null); setBusy(false) } }}>
    <div className="admin-portrait-summary">
      <div className="admin-avatar-frame">{item.image ? <img src={item.image} alt="Ảnh đại diện" style={style} /> : <ImagePlus size={28} />}</div>
      <Dialog.Trigger asChild><button type="button" className="admin-button admin-button--secondary" disabled={disabled}>Chỉnh ảnh</button></Dialog.Trigger>
    </div>
    <Dialog.Portal><Dialog.Overlay className="admin-confirm-overlay" /><Dialog.Content className="admin-media-dialog">
      <div className="admin-surface-heading"><Dialog.Title>Chỉnh ảnh đại diện</Dialog.Title><Dialog.Close asChild><button type="button" className="admin-icon-button" aria-label="Đóng"><X size={18} /></button></Dialog.Close></div>
      <Dialog.Description>Kéo ảnh trong khung và điều chỉnh độ phóng to. Ảnh gốc được giữ nguyên.</Dialog.Description>
      {draft && <PortraitPanel item={draft} onChange={patch => setDraft(previous => ({ ...previous, ...patch }))} disabled={disabled} onBusyChange={setBusy} />}
      <div className="admin-form-actions"><Dialog.Close asChild><button type="button" className="admin-button admin-button--ghost">Hủy</button></Dialog.Close><button type="button" className="admin-button admin-button--primary" disabled={disabled || busy} onClick={() => { onChange(draft); setDraft(null) }}>Áp dụng ảnh</button></div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>
}


function PortraitPanel({ item, onChange, disabled, onBusyChange }) {
  const drag = useRef(null)
  const x = item.focalX ?? 50, y = item.focalY ?? 50, zoom = item.zoom ?? 1
  const clamp = number => Math.max(0, Math.min(100, number))
  return <div className="admin-avatar-editor">
    <MediaField label="Ảnh đại diện" value={item.image || ''} onChange={image => onChange({ image })} disabled={disabled} variant="compact" onBusyChange={onBusyChange} />
    {item.image && <><div className="admin-avatar-frame" role="group" tabIndex={disabled ? -1 : 0} aria-label="Kéo ảnh để chọn vùng khuôn mặt; dùng phím mũi tên để điều chỉnh" onKeyDown={event => {
      const delta = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[event.key]
      if (!delta || disabled) return
      event.preventDefault()
      onChange({ focalX: clamp(x + delta[0]), focalY: clamp(y + delta[1]) })
    }} onPointerDown={event => {
      if (disabled || event.currentTarget.closest('fieldset:disabled')) return
      const rect = event.currentTarget.getBoundingClientRect()
      drag.current = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x, y, size: rect.width }
      event.currentTarget.setPointerCapture(event.pointerId)
    }} onPointerMove={event => {
      const start = drag.current
      if (!start || start.pointer !== event.pointerId) return
      onChange({ focalX: clamp(start.x - (event.clientX - start.startX) / start.size * 100 / zoom), focalY: clamp(start.y - (event.clientY - start.startY) / start.size * 100 / zoom) })
    }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}>
      <img src={item.image} alt="Vùng ảnh đại diện" draggable="false" style={{ objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` }} />
    </div><small className="admin-muted">Kéo ảnh trong khung hoặc dùng phím mũi tên để chọn vùng khuôn mặt.</small>
    <label>Phóng to · {zoom.toFixed(2)}×<input aria-label="Phóng to ảnh đại diện" type="range" min="1" max="2.5" step="0.05" value={zoom} disabled={disabled} onChange={event => onChange({ zoom: Number(event.target.value) })} /></label></>}
  </div>
}
