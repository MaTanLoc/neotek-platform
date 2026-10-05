import { EditorActions } from './EditorControls'

export function CtaEditor({ value, onChange, pending }) {
  const item = value?.items?.[0] || { title: '', eyebrow: '', description: '', primary: {}, secondary: {} }
  const update = (patch) => onChange({ ...value, items: [{ ...item, ...patch }] })
  const updateAction = (name, patch) => update({ [name]: { ...(item[name] || {}), ...patch } })
  return (
    <>
      <div className="admin-form-grid admin-form-grid--two">
        <label>Eyebrow<input value={item.eyebrow || ''} onChange={e => update({ eyebrow: e.target.value })} /></label>
        <label>Title<input required value={item.title || ''} onChange={e => update({ title: e.target.value })} /></label>
      </div>
      <label>Description<textarea rows="3" value={item.description || ''} onChange={e => update({ description: e.target.value })} /></label>
      <div className="admin-form-grid admin-form-grid--two">
        {['primary', 'secondary'].map((name, index) => (
          <fieldset className="admin-editor-subitem" key={name}>
            <legend>{index === 0 ? 'Primary button' : 'Secondary button'}</legend>
            <label>Label<input value={item[name]?.label || ''} onChange={e => updateAction(name, { label: e.target.value })} /></label>
            <label>URL<input value={item[name]?.url || ''} onChange={e => updateAction(name, { url: e.target.value })} /></label>
          </fieldset>
        ))}
      </div>
      <EditorActions pending={pending} />
    </>
  )
}
