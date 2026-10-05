import { EditorActions, ItemControls } from './EditorControls'
import { moveItem, updateItem } from './editorUtils'

export function ProofMetricsEditor({ value, onChange, pending }) {
  const items = Array.isArray(value?.items) ? value.items : []
  const setItems = next => onChange({ ...value, items: next })
  const add = () => setItems([...items, { key: '', label: '', value: '', suffix: '' }])
  return (
    <>
      <div className="admin-editor-items">
        {items.map((item, index) => (
          <fieldset className="admin-editor-item" key={`${item.key || 'metric'}-${index}`}>
            <legend>Metric {index + 1}</legend>
            <div className="admin-form-grid admin-form-grid--two">
              <label>Internal key<input value={item.key || ''} onChange={e => setItems(updateItem(items, index, { key: e.target.value }))} /></label>
              <label>Value<input value={item.value ?? ''} onChange={e => setItems(updateItem(items, index, { value: e.target.value }))} /></label>
              <label>Label<input required value={item.label || ''} onChange={e => setItems(updateItem(items, index, { label: e.target.value }))} /></label>
              <label>Suffix<input value={item.suffix || ''} onChange={e => setItems(updateItem(items, index, { suffix: e.target.value }))} /></label>
            </div>
            <ItemControls index={index} total={items.length} onMove={(itemIndex, direction) => setItems(moveItem(items, itemIndex, direction))} onRemove={itemIndex => setItems(items.filter((_, metricIndex) => metricIndex !== itemIndex))} />
          </fieldset>
        ))}
      </div>
      <button type="button" className="admin-button admin-button--ghost" onClick={add}>Add metric</button>
      <EditorActions pending={pending} />
    </>
  )
}
