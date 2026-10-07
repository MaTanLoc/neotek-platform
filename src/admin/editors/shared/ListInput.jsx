import {useId, useState} from 'react'
import {Plus, X} from 'lucide-react'

export function ListInput({ label, value = [], onChange, disabled }) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const add = () => {
    const entry = draft.trim()
    if (!entry || disabled) return
    if (!value.some(item => item.trim() === entry)) onChange([...value, entry])
    setDraft('')
  }
  return <div className="admin-list-input">
    <label htmlFor={id}>{label}</label>
    <div className="admin-list-input__entry">
      <input id={id} value={draft} disabled={disabled} placeholder="Nhập tính năng rồi nhấn Enter" onChange={event => setDraft(event.target.value)} onKeyDown={event => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); add() }
      }} />
      <button type="button" className="admin-icon-button" aria-label="Thêm tính năng" title="Thêm tính năng" disabled={disabled || !draft.trim()} onClick={add}><Plus size={16} /></button>
    </div>
    <ul>{value.map((entry, index) => <li key={index}><span>{entry}</span><button type="button" className="admin-icon-button" aria-label={`Xóa tính năng: ${entry}`} title="Xóa tính năng" disabled={disabled} onClick={() => onChange(value.filter((_, i) => i !== index))}><X size={14} /></button></li>)}</ul>
  </div>
}
