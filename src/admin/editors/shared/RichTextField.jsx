import {useEffect, useRef, useState} from 'react'
import {Dialog} from 'radix-ui'
import {Bold, Italic, Link, Pilcrow, WrapText, Unlink, List, RemoveFormatting} from 'lucide-react'

function cleanHtml(html) {
  const template = document.createElement('template')
  template.innerHTML = html
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'A', 'DIV', 'UL', 'LI'])
  const clean = node => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent)
    if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT'].includes(node.tagName)) return document.createTextNode('')
    const result = allowed.has(node.tagName) ? document.createElement(node.tagName === 'DIV' ? 'p' : node.tagName.toLowerCase()) : document.createDocumentFragment()
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || ''
      if (/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href)) result.setAttribute('href', href)
    }
    for (const child of node.childNodes) result.append(clean(child))
    return result
  }
  const container = document.createElement('div')
  for (const child of template.content.childNodes) container.append(clean(child))
  return container.innerHTML
}
export function RichTextField({ value, onChange, label, disabled }) {
  const ref = useRef(null)
  const emitted = useRef(null)
  const selection = useRef(null)
  const pendingLink = useRef(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkHref, setLinkHref] = useState('')
  const [linkError, setLinkError] = useState(false)
  const openLink = () => {
    if (disabled || ref.current.closest('fieldset:disabled')) return
    const range = window.getSelection()
    selection.current = range?.rangeCount ? range.getRangeAt(0).cloneRange() : null
    setLinkHref(''); setLinkError(false); setLinkOpen(true)
  }
  const saveLink = () => {
    if (!/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(linkHref.trim())) { setLinkError(true); return }
    pendingLink.current = linkHref.trim()
    setLinkOpen(false)
  }
  const restoreLinkFocus = event => {
    event.preventDefault()
    ref.current?.focus()
    if (selection.current) { const current = window.getSelection(); current.removeAllRanges(); current.addRange(selection.current) }
    if (pendingLink.current) { apply('createLink', pendingLink.current); pendingLink.current = null }
  }
  useEffect(() => { if (ref.current && value !== emitted.current) ref.current.innerHTML = cleanHtml(value || '') }, [value])
  const emit = () => { emitted.current = cleanHtml(ref.current.innerHTML); onChange(emitted.current) }
  const apply = (command, argument) => {
    if (disabled || ref.current.closest('fieldset:disabled')) return
    ref.current.focus()
    document.execCommand(command, false, argument)
    if (command === 'removeFormat') document.execCommand('unlink', false)
    emit()
  }
  const tools = [['bold', 'In đậm', Bold], ['italic', 'In nghiêng', Italic], ['formatBlock', 'Đoạn văn', Pilcrow], ['insertUnorderedList', 'Danh sách', List], ['insertLineBreak', 'Xuống dòng', WrapText], ['unlink', 'Bỏ liên kết', Unlink], ['removeFormat', 'Xóa định dạng', RemoveFormatting]]
  return <div className="admin-rich-field"><span className="admin-field-label">{label}</span>
    <div className="admin-rich-toolbar" role="group" aria-label={`Định dạng ${label}`}>
      {tools.map(([command, title, Icon]) => <button type="button" disabled={disabled} key={command} className="admin-icon-button" aria-label={title} title={title} onMouseDown={event => event.preventDefault()} onClick={() => apply(command, command === 'formatBlock' ? 'p' : undefined)}><Icon size={16} /></button>)}
      <button type="button" disabled={disabled} className="admin-icon-button" aria-label="Thêm liên kết" title="Thêm liên kết" onMouseDown={event => event.preventDefault()} onClick={openLink}><Link size={16} /></button>
    </div>
    <div ref={ref} contentEditable={!disabled} aria-disabled={disabled} suppressContentEditableWarning role="textbox" aria-label={label} aria-multiline="true" className="admin-rich-input" onInput={emit} onPaste={event => { event.preventDefault(); if (disabled) return; document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); emit() }} />
    <Dialog.Root open={linkOpen} onOpenChange={setLinkOpen}><Dialog.Portal><Dialog.Overlay className="admin-confirm-overlay" /><Dialog.Content className="admin-confirm-content" onCloseAutoFocus={restoreLinkFocus}>
      <Dialog.Title>Thêm liên kết</Dialog.Title><Dialog.Description>Nhập https://…, /… hoặc #… cho phần văn bản đã chọn.</Dialog.Description>
      <label>Liên kết văn bản<input aria-label="Đường dẫn liên kết" value={linkHref} onChange={event => { setLinkHref(event.target.value); setLinkError(false) }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); saveLink() } }} /></label>
      {linkError && <p role="alert">Đường dẫn chưa hợp lệ.</p>}
      <div className="admin-form-actions"><Dialog.Close className="admin-button admin-button--ghost">Hủy</Dialog.Close><button type="button" className="admin-button admin-button--primary" onClick={saveLink}>Thêm liên kết</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>
}
