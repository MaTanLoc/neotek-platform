import { EditorActions, ItemControls } from './EditorControls'
import { moveItem, updateItem } from './editorUtils'

export function TestimonialsEditor({ value, onChange, pending }) {
  const items = Array.isArray(value?.items) ? value.items : []
  const setItems = next => onChange({ ...value, items: next })
  const add = () => setItems([...items, { quote: '', name: '', role: '', company: '', image: '' }])
  return (
    <>
      <div className="admin-editor-items">
        {items.map((item, index) => (
          <fieldset className="admin-editor-item" key={`${item.name || 'testimonial'}-${index}`}>
            <legend>Testimonial {index + 1}</legend>
            <label>Quote<textarea rows="5" value={item.quote || ''} onChange={e => setItems(updateItem(items, index, { quote: e.target.value }))} /></label>
            <div className="admin-form-grid admin-form-grid--two">
              <label>Name<input required value={item.name || ''} onChange={e => setItems(updateItem(items, index, { name: e.target.value }))} /></label>
              <label>Role<input value={item.role || ''} onChange={e => setItems(updateItem(items, index, { role: e.target.value }))} /></label>
              <label>Company<input value={item.company || ''} onChange={e => setItems(updateItem(items, index, { company: e.target.value }))} /></label>
              <label>Current image reference<input value={item.image || ''} onChange={e => setItems(updateItem(items, index, { image: e.target.value }))} /></label>
            </div>
            <ItemControls index={index} total={items.length} onMove={(itemIndex, direction) => setItems(moveItem(items, itemIndex, direction))} onRemove={itemIndex => setItems(items.filter((_, testimonialIndex) => testimonialIndex !== itemIndex))} />
          </fieldset>
        ))}
      </div>
      <button type="button" className="admin-button admin-button--ghost" onClick={add}>Add testimonial</button>
      <EditorActions pending={pending} />
    </>
  )
}
