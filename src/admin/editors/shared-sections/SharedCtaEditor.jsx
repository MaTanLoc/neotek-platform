import {CtaRow, BilingualPanel, EditorPanel} from '../shared/EditorPrimitives'
import {RichTextField} from '../shared/RichTextField'

export function SharedCtaEditor({ value, pairedValue, onChange, onPairedChange, pending, sectionKey }) {
  const empty = { title: '', eyebrow: '', description: '', primary: {}, secondary: {} }
  const vi = value || {}, en = pairedValue || {}
  const a = vi.items?.[0] || empty, b = en.items?.[0] || empty
  const actions = sectionKey === 'footerCta' ? ['primary'] : ['primary', 'secondary']
  const write = (nextVi, nextEn) => { onChange(nextVi); onPairedChange(nextEn) }
  const content = (source, item) => ({ ...source, items: [item, ...(source.items || []).slice(1)] })
  const update = (language, patch) => write(content(vi, { ...a, ...(language === 'vi' ? patch : {}) }), content(en, { ...b, ...(language === 'en' ? patch : {}) }))
  const fields = (language, item) => <>      {[['eyebrow', 'Dòng giới thiệu'], ['title', 'Tiêu đề']].map(([key, label]) => <label key={key}>{label}{key === 'eyebrow' ? <input value={item[key] || ''} onChange={event => update(language, { [key]: event.target.value })} /> : <textarea rows={2} value={item[key] || ''} onChange={event => update(language, { [key]: event.target.value })} />}</label>)}
      <RichTextField label="Mô tả" value={item.description || ''} disabled={pending} onChange={description => update(language, { description })} />
</>
  return <div className="admin-standard-editor">
    <EditorPanel title="Nội dung"><BilingualPanel vi={fields('vi', a)} en={fields('en', b)} /></EditorPanel>
    <EditorPanel title="Nút hành động"><div className="admin-editor-group">{actions.map(name => <CtaRow key={name} kind={name === 'primary' ? 'Nút chính' : 'Nút phụ'} vi={a[name]} en={b[name]} disabled={pending} variant={a[name]?.variant || name} enabled={a[name]?.enabled !== false} onVariantChange={variant => write(content(vi, { ...a, [name]: { ...a[name], variant } }), content(en, { ...b, [name]: { ...b[name], variant } }))} onLabelChange={(language, label) => update(language, { [name]: { ...(language === 'vi' ? a : b)[name], label } })} onSharedChange={patch => write(content(vi, { ...a, [name]: { ...a[name], ...patch } }), content(en, { ...b, [name]: { ...b[name], ...patch } }))} />)}</div></EditorPanel>
  </div>
}
