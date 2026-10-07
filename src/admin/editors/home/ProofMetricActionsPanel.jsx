import {Plus} from 'lucide-react'
import {ItemActionRow} from '../shared/ItemActionRow'
import {moveItem} from '../../utils/itemOperations'
import {CtaRow} from '../shared/EditorPrimitives'

export function ProofMetricActionsPanel({ value, pairedValue, onChange, onPairedChange, pending }) {
  const vi = value || {}, en = pairedValue || {}
  const a = vi.actions || [], b = en.actions || []
  const aligned = a.length === b.length && a.every((item, i) => item.key === b[i]?.key)
  const write = (nextVi, nextEn) => { onChange(nextVi); onPairedChange(nextEn) }
  const writeActions = (nextVi, nextEn) => write({ ...vi, actions: nextVi }, { ...en, actions: nextEn })
  return <div className="admin-standard-editor"><strong>Nút hành động</strong>{a.map((item, index) => <div className="admin-editor-group" key={item.key}>
    <CtaRow kind="CTA" vi={item} en={b[index]} variant={item.variant} disabled={pending || !aligned} onLabelChange={(language, label) => {
      const update = items => items.map((entry, i) => i === index ? { ...entry, label } : entry)
      writeActions(language === 'vi' ? update(a) : a, language === 'en' ? update(b) : b)
    }} onSharedChange={patch => { const update = items => items.map((entry, i) => i === index ? { ...entry, ...patch } : entry); writeActions(update(a), update(b)) }} onVariantChange={variant => { const update = items => items.map((entry, i) => i === index ? { ...entry, variant } : entry); writeActions(update(a), update(b)) }} />
    {aligned && <ItemActionRow index={index} total={a.length} onMove={(_, direction) => writeActions(moveItem(a, index, direction), moveItem(b, index, direction))} onRemove={() => writeActions(a.filter((_, i) => i !== index), b.filter((_, i) => i !== index))} />}
  </div>)}<button type="button" className="admin-button admin-button--secondary" disabled={!aligned} onClick={() => { const item = { key: `action-${crypto.randomUUID()}`, label: '', url: '', variant: 'primary' }; writeActions([...a, item], [...b, { ...item }]) }}><Plus size={16} aria-hidden="true" />Thêm nút VI/EN</button></div>
}
