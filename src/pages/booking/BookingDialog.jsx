import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { NeotekButton } from '../../components/common/NeotekButton/NeotekButton'
import BookingModuleSelect from './BookingModuleSelect'
import { formatDate, parseDate, TIME_ZONE, timeLabel } from './bookingUtils'
import { useInlineValidation } from '../../components/forms/useInlineValidation'
import { fieldValidators } from '../../components/forms/fieldValidation'
import { FieldError } from '../../components/forms/FieldError'

const emptyForm = { name: undefined, company: '', phone: '', message: '' }

export default function BookingDialog({ open, slot, submitState, onSubmit, onClose, onBookAnother, returnFocusRef, homePath, t, language, flow, matchesHold, onChangeTime }) {
  const [formData, setFormData] = useState(emptyForm)
  const firstInputRef = useRef(null)
  const formRef = useRef(null)
  const en = language === 'en', success = submitState === 'success'
  const moduleName = flow.options?.modules.find(item => item.key === flow.moduleKey)?.[en ? 'en' : 'vi']
  const update = event => setFormData(current => ({ ...current, [event.target.name]: event.target.value }))
  const rules = fieldValidators(language)
  const validation = useInlineValidation(values => ({
    ...(flow.customer ? { name: rules.text(values.name, 120), email: rules.email(values.email), company: rules.text(values.company, 160), phone: rules.phone(values.phone), message: rules.message(values.message) } : {}),
    module: values.module ? '' : flow.copy.choose,
  }))

  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="booking-dialog-overlay" />
      <Dialog.Content className="booking-dialog" onOpenAutoFocus={event => {
        const missing = [...document.querySelectorAll('.booking-form input[required]:not([readonly])')].find(input => !input.value)
        const target = missing || document.getElementById('booking-module') || firstInputRef.current
        if (target) { event.preventDefault(); target.focus({ preventScroll: true }) }
      }} onCloseAutoFocus={event => {
        event.preventDefault()
        const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : document.querySelector('.booking-day__surface')
        target?.focus({ preventScroll: true })
      }} onPointerDownOutside={event => { if (success || flow.busy) event.preventDefault() }} onEscapeKeyDown={event => { if (flow.busy) event.preventDefault() }}>
        <div className="booking-dialog__heading">
          <div><p className="neotek-eyebrow">{en ? 'NeoTek consultation' : 'Tư vấn cùng NeoTek'}</p><Dialog.Title>{t(success ? 'booking.successTitle' : 'booking.drawerTitle')}</Dialog.Title></div>
          <Dialog.Close asChild><button type="button" disabled={flow.busy} className="booking-icon-button" aria-label={t('booking.close')}><HugeiconsIcon icon={Cancel01Icon} size={20} color="currentColor" strokeWidth={1.6} /></button></Dialog.Close>
        </div>
        <div className="booking-summary">
          <strong>{formatDate(parseDate(slot.date), language)}</strong>
          <span>{timeLabel(slot.startMinutes)} – {timeLabel(slot.endMinutes)}</span>
          <span>{t('booking.minutes', { count: slot.endMinutes - slot.startMinutes })} · {TIME_ZONE}</span>
          {success && <span className="booking-summary__module">{moduleName}</span>}
        </div>
        <Dialog.Description className={success ? 'neotek-visually-hidden' : 'booking-dialog__notice'}>{success ? flow.copy.success : flow.customer ? (en ? 'Complete your contact details and choose a solution.' : 'Bổ sung thông tin liên hệ và chọn giải pháp cần tư vấn.') : (en ? 'Choose a solution, then sign in to complete your booking.' : 'Chọn giải pháp, sau đó đăng nhập để hoàn tất đặt lịch.')}</Dialog.Description>
        {flow.error && <p className="booking-dialog__error" role="alert">{flow.error}</p>}
        {matchesHold && !success && <p className="booking-hold-status" role="timer">{flow.seconds > 0 ? `${flow.copy.hold} ${String(Math.floor(flow.seconds / 60)).padStart(2, '0')}:${String(flow.seconds % 60).padStart(2, '0')}` : flow.copy.expired}</p>}
        {success ? <>
          <div className="booking-success" role="status"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={32} color="currentColor" strokeWidth={1.6} aria-hidden="true" /><p>{flow.copy.success}</p></div>
          <div className="booking-success__actions"><NeotekButton onClick={() => { setFormData(emptyForm); validation.reset(); onBookAnother() }}>{t('booking.bookAnother')}</NeotekButton><NeotekButton variant="secondary" href={homePath}>{t('booking.home')}</NeotekButton></div>
        </> : <form className="booking-form" ref={formRef} noValidate {...validation.events} onSubmit={event => {
          event.preventDefault()
          if (!validation.validate(event.currentTarget)) return
          onSubmit({ ...formData, name: formData.name ?? flow.customer?.name ?? '' }, () => true)
        }}>
          {flow.customer && <>
            {[
              { name: 'name', type: 'text', autoComplete: 'name', maxLength: 120 },
              { name: 'email', type: 'email', autoComplete: 'email', maxLength: 254 },
              { name: 'company', type: 'text', autoComplete: 'organization', maxLength: 160 },
              { name: 'phone', type: 'tel', autoComplete: 'tel', maxLength: 32 },
            ].map(field => <div className="booking-form__field" key={field.name}>
              <label htmlFor={`booking-${field.name}`}>{t(`booking.fields.${field.name}`)} <span aria-hidden="true">*</span></label>
              <input {...field} {...validation.field(field.name)} ref={field.name === 'name' ? firstInputRef : undefined} id={`booking-${field.name}`} required readOnly={field.name === 'email'} disabled={flow.busy} value={field.name === 'email' ? flow.customer.email : field.name === 'name' ? formData.name ?? flow.customer.name ?? '' : formData[field.name]} onChange={update} />
              <FieldError validation={validation} name={field.name} />
            </div>)}
          </>}
          <div className="booking-form__field--full"><BookingModuleSelect flow={flow} language={language} validation={validation} onBlur={() => validation.touch('module', formRef.current)} onChange={value => { flow.setModuleKey(value); flow.setError(''); flow.saveIntent(slot, value); validation.revalidate(formRef.current, { module: value }) }} /></div>
          {flow.customer && <div className="booking-form__field booking-form__field--full"><label htmlFor="booking-message">{t('booking.fields.message')}</label><textarea id="booking-message" name="message" rows={2} disabled={flow.busy} maxLength={2000} value={formData.message} onChange={update} {...validation.field('message')} /><FieldError validation={validation} name="message" /></div>}
          <div className="booking-form__actions">
            <NeotekButton type="submit" disabled={flow.busy || flow.status === 'loading' || !flow.options} className="booking-form__submit">{flow.busy ? flow.copy.loading : en ? 'Book now' : 'Đặt lịch ngay'}</NeotekButton>
            <div className="booking-flow-actions"><NeotekButton type="button" variant="secondary" disabled={flow.busy} onClick={onClose}>{en ? 'Cancel' : 'Hủy'}</NeotekButton>{matchesHold && <button className="booking-change-time" type="button" disabled={flow.busy} onClick={onChangeTime}>{flow.copy.change}</button>}</div>
          </div>
        </form>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
