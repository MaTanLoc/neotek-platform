import {Select} from 'radix-ui'
import {Check, ChevronDown, ChevronUp} from 'lucide-react'

export function SelectField({ value = '', onChange, options, disabled, label }) {
  const empty = '__default__'
  const entries = options.some(([key]) => key === value) ? options : [[value, value || 'Theo mặc định'], ...options]
  return <Select.Root value={value || empty} onValueChange={next => onChange(next === empty ? '' : next)} disabled={disabled}>
    <Select.Trigger className="admin-select-trigger" aria-label={label}><Select.Value /><Select.Icon><ChevronDown size={16} /></Select.Icon></Select.Trigger>
    <Select.Portal><Select.Content className="admin-select-content" position="popper" sideOffset={4}>
      <Select.ScrollUpButton aria-label="Cuộn lên"><ChevronUp size={16} /></Select.ScrollUpButton>
      <Select.Viewport>{entries.map(([key, text, icon]) => <Select.Item className="admin-select-item" key={key} value={key || empty}><Select.ItemText><span className="admin-select-label">{icon}{text}</span></Select.ItemText><Select.ItemIndicator><Check size={14} /></Select.ItemIndicator></Select.Item>)}</Select.Viewport>
      <Select.ScrollDownButton aria-label="Cuộn xuống"><ChevronDown size={16} /></Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>
}
