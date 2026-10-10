import { Select } from 'radix-ui'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { FieldError } from '../../components/forms/FieldError'

export default function BookingModuleSelect({ flow, language, onChange, onBlur, validation }) {
  return <div className="booking-form__field">
    <label htmlFor="booking-module">{flow.copy.solution} <span aria-hidden="true">*</span></label>
    <Select.Root name="module" value={flow.moduleKey} onValueChange={onChange} required disabled={flow.busy || !flow.options?.modules.length}>
      <Select.Trigger id="booking-module" data-validation-field="module" onBlur={onBlur} {...validation?.field('module')} className="booking-select-trigger"><Select.Value placeholder={flow.copy.choose} /><Select.Icon><ChevronDown size={16} /></Select.Icon></Select.Trigger>
      <Select.Portal><Select.Content className="booking-select-content" position="popper" sideOffset={5}>
        <Select.ScrollUpButton><ChevronUp size={16} /></Select.ScrollUpButton>
        <Select.Viewport>{flow.options?.modules.map(item => <Select.Item className="booking-select-item" key={item.key} value={item.key}>
          <Select.ItemText>{item[language === 'en' ? 'en' : 'vi']}</Select.ItemText><Select.ItemIndicator><Check size={14} /></Select.ItemIndicator>
        </Select.Item>)}</Select.Viewport>
        <Select.ScrollDownButton><ChevronDown size={16} /></Select.ScrollDownButton>
      </Select.Content></Select.Portal>
    </Select.Root>
    {validation && <FieldError validation={validation} name="module" />}
  </div>
}
