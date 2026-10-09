import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { NeotekButton } from '../../components/common/NeotekButton/NeotekButton'
import { formatDate, parseDate, TIME_ZONE, timeLabel } from './bookingUtils'

const emptyForm = { name: '', email: '', company: '', phone: '', message: '' }

export default function BookingDialog({ open, slot, submitState, onSubmit, onClose, onBookAnother, returnFocusRef, homePath, t, language, flow, matchesHold, onAcquire, onChangeTime }) {
  const [formData, setFormData] = useState(emptyForm)
  const firstInputRef = useRef(null)

  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="booking-dialog-overlay" />
        <Dialog.Content className="booking-dialog" onOpenAutoFocus={(event) => {
          if (firstInputRef.current) { event.preventDefault(); firstInputRef.current.focus({ preventScroll: true }) }
        }} onCloseAutoFocus={(event) => {
          event.preventDefault()
          const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : document.querySelector('.booking-day__surface')
          target?.focus({ preventScroll: true })
        }} onPointerDownOutside={(event) => { if (submitState === 'success' || flow.busy) event.preventDefault() }} onEscapeKeyDown={event => { if (flow.busy) event.preventDefault() }}>
          <div className="booking-dialog__heading">
            <Dialog.Title>{t(submitState === 'success' ? 'booking.successTitle' : 'booking.drawerTitle')}</Dialog.Title>
            <Dialog.Close asChild><button type="button" disabled={flow.busy} className="booking-icon-button" aria-label={t('booking.close')}><HugeiconsIcon icon={Cancel01Icon} size={20} color="currentColor" strokeWidth={1.6} /></button></Dialog.Close>
          </div>
          {submitState === 'success' && <div className="booking-success" role="status"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={36} color="currentColor" strokeWidth={1.6} aria-hidden="true" /><p>{flow.copy.success}</p></div>}
          <div className="booking-summary">
            <strong>{formatDate(parseDate(slot.date), language)}</strong>
            <span>{timeLabel(slot.startMinutes)} – {timeLabel(slot.endMinutes)}</span>
            <span>{t('booking.minutes', { count: slot.endMinutes - slot.startMinutes })} · {TIME_ZONE} · {t('booking.gmt')}</span>
          </div>
          <Dialog.Description className="booking-dialog__notice">{flow.copy.real}</Dialog.Description>
          {flow.error && <p role="alert">{flow.error}</p>}
          {flow.hold && <p role="timer">{flow.seconds > 0 ? `${flow.copy.hold} ${Math.floor(flow.seconds / 60)}:${String(flow.seconds % 60).padStart(2, '0')}` : flow.copy.expired}</p>}
          {submitState === 'success' ? <div className="booking-success__actions">
            <NeotekButton onClick={onBookAnother}>{t('booking.bookAnother')}</NeotekButton>
            <NeotekButton variant="secondary" href={homePath}>{t('booking.home')}</NeotekButton>
          </div> : <>
          <label className="booking-form__field">{flow.copy.solution}<select disabled={flow.busy} value={flow.moduleKey} onChange={event => flow.setModuleKey(event.target.value)}><option value="">{flow.copy.choose}</option>{flow.options?.modules.map(item => <option key={item.key} value={item.key}>{item[language === 'en' ? 'en' : 'vi']}</option>)}</select></label>
          {!matchesHold || flow.seconds <= 0 ? <NeotekButton disabled={flow.busy || flow.status === 'loading'} onClick={onAcquire}>{flow.busy ? flow.copy.loading : flow.copy.acquire}</NeotekButton> : <form className="booking-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...formData, name: formData.name || flow.customer?.name || '' }) }}>
            {[
              { name: 'name', type: 'text', autoComplete: 'name', maxLength: 120 },
              { name: 'email', type: 'email', autoComplete: 'email', maxLength: 254 },
              { name: 'company', type: 'text', autoComplete: 'organization', maxLength: 160 },
              { name: 'phone', type: 'tel', autoComplete: 'tel', maxLength: 32 },
            ].map((field) => <div className="booking-form__field" key={field.name}>
              <label htmlFor={`booking-${field.name}`}>{t(`booking.fields.${field.name}`)} <span aria-hidden="true">*</span></label>
              <input {...field} ref={field.name === 'name' ? firstInputRef : undefined} id={`booking-${field.name}`} required readOnly={field.name === 'email'} disabled={flow.busy} value={field.name === 'email' ? flow.customer?.email || '' : field.name === 'name' ? formData.name || flow.customer?.name || '' : formData[field.name]} onChange={(event) => setFormData((current) => ({ ...current, [field.name]: event.target.value }))} />
            </div>)}
            <div className="booking-form__field"><label htmlFor="booking-message">{t('booking.fields.message')}</label>
              <textarea id="booking-message" name="message" rows={3} maxLength={2000} value={formData.message} onChange={(event) => setFormData((current) => ({ ...current, message: event.target.value }))} />
            </div>
            <NeotekButton type="submit" disabled={flow.busy} className="booking-form__submit">{flow.busy ? flow.copy.loading : flow.copy.confirmBooking}</NeotekButton>
          </form>}
          <div className="booking-flow-actions"><NeotekButton variant="secondary" disabled={flow.busy} onClick={onChangeTime}>{flow.copy.change}</NeotekButton><NeotekButton variant="ghost" disabled={flow.busy} onClick={onClose}>{flow.copy.cancelled}</NeotekButton></div>
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
