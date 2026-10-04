import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { NeotekButton } from '../../components/common/NeotekButton/NeotekButton'
import { formatDate, parseDate, TIME_ZONE, timeLabel } from './bookingUtils'

const emptyForm = { name: '', email: '', company: '', phone: '', message: '' }

export default function BookingDialog({ open, slot, submitState, onSubmit, onClose, onBookAnother, returnFocusRef, homePath, t, language }) {
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
        }} onPointerDownOutside={(event) => { if (submitState === 'success') event.preventDefault() }}>
          <div className="booking-dialog__heading">
            <Dialog.Title>{t(submitState === 'success' ? 'booking.successTitle' : 'booking.drawerTitle')}</Dialog.Title>
            <Dialog.Close asChild><button type="button" className="booking-icon-button" aria-label={t('booking.close')}><HugeiconsIcon icon={Cancel01Icon} size={20} color="currentColor" strokeWidth={1.6} /></button></Dialog.Close>
          </div>
          {submitState === 'success' && <div className="booking-success" role="status"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={36} color="currentColor" strokeWidth={1.6} aria-hidden="true" /><p>{t('booking.successDescription')}</p></div>}
          <div className="booking-summary">
            <strong>{formatDate(parseDate(slot.date), language)}</strong>
            <span>{timeLabel(slot.startMinutes)} – {timeLabel(slot.endMinutes)}</span>
            <span>{t('booking.minutes', { count: slot.endMinutes - slot.startMinutes })} · {TIME_ZONE} · {t('booking.gmt')}</span>
          </div>
          <Dialog.Description className="booking-dialog__notice">{t('booking.mockNotice')}</Dialog.Description>
          {submitState === 'success' ? <div className="booking-success__actions">
            <NeotekButton onClick={onBookAnother}>{t('booking.bookAnother')}</NeotekButton>
            <NeotekButton variant="secondary" href={homePath}>{t('booking.home')}</NeotekButton>
          </div> : <form className="booking-form" onSubmit={(event) => { event.preventDefault(); onSubmit(formData) }}>
            {[
              { name: 'name', type: 'text', autoComplete: 'name', maxLength: 120 },
              { name: 'email', type: 'email', autoComplete: 'email', maxLength: 254 },
              { name: 'company', type: 'text', autoComplete: 'organization', maxLength: 160 },
              { name: 'phone', type: 'tel', autoComplete: 'tel', maxLength: 32 },
            ].map((field) => <div className="booking-form__field" key={field.name}>
              <label htmlFor={`booking-${field.name}`}>{t(`booking.fields.${field.name}`)} <span aria-hidden="true">*</span></label>
              <input {...field} ref={field.name === 'name' ? firstInputRef : undefined} id={`booking-${field.name}`} required value={formData[field.name]} onChange={(event) => setFormData((current) => ({ ...current, [field.name]: event.target.value }))} />
            </div>)}
            <div className="booking-form__field"><label htmlFor="booking-message">{t('booking.fields.message')}</label>
              <textarea id="booking-message" name="message" rows={3} maxLength={2000} value={formData.message} onChange={(event) => setFormData((current) => ({ ...current, message: event.target.value }))} />
            </div>
            <NeotekButton type="submit" className="booking-form__submit">{t('booking.confirm')}</NeotekButton>
          </form>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
