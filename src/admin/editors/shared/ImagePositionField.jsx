import {SelectField} from './SelectField'
import {AlignLeft, AlignCenter, AlignRight, SlidersHorizontal} from 'lucide-react'

const percentages = { left: 0, top: 0, center: 50, right: 100, bottom: 100 }
function parseImagePosition(value = '') {
  const parts = value.trim().split(/\s+/)
  const percent = (part, fallback) => percentages[part] ?? (/^-?\d+(\.\d+)?%$/.test(part || '') ? Number.parseFloat(part) : fallback)
  const x = percent(parts[0], 50), y = percent(parts[1], 50)
  const preset = !value || ['left', 'left center'].includes(value) ? (value ? 'left' : 'center') : ['center', 'center center'].includes(value) ? 'center' : ['right', 'right center'].includes(value) ? 'right' : 'custom'
  return { preset, x, y }
}

export function ImagePositionField({ value, label = 'Vị trí ảnh', onChange, disabled }) {
  const { preset, x, y } = parseImagePosition(value)
  return <div className="admin-image-position">
    <label>{label}<SelectField label={label} value={preset} options={[['left', 'Trái', <AlignLeft size={16} />], ['center', 'Giữa', <AlignCenter size={16} />], ['right', 'Phải', <AlignRight size={16} />], ['custom', 'Tùy chỉnh', <SlidersHorizontal size={16} />]]} disabled={disabled} onChange={next => onChange(next === 'custom' ? `${x}% ${y}%` : next)} /></label>
    {preset === 'custom' && <div className="admin-form-grid admin-form-grid--two">{[['X', x], ['Y', y]].map(([axis, number]) => <label key={axis}>Vị trí {axis} (%)<input type="number" min="0" max="100" step="1" disabled={disabled} value={number} onChange={event => { if (event.target.value !== '') { const next = Math.max(0, Math.min(100, Number(event.target.value))); onChange(`${axis === 'X' ? next : x}% ${axis === 'Y' ? next : y}%`) } }} /></label>)}</div>}
  </div>
}
