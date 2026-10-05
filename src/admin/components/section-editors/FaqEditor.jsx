import { EditorActions, ItemControls } from './EditorControls'
import { moveItem, updateItem } from './editorUtils'

export function FaqEditor({ value, onChange, pending }) {
  const items = Array.isArray(value?.items) ? value.items : []
  const setItems = next => onChange({ ...value, items: next })
  const add = () => setItems([...items, { question: '', answer: '' }])
  return (
    <>
      <div className="admin-editor-items">
        {items.map((item, index) => (
          <fieldset className="admin-editor-item" key={`faq-${index}`}>
            <legend>Question {index + 1}</legend>
            <label>Question<input required value={item.question || ''} onChange={e => setItems(updateItem(items, index, { question: e.target.value }))} /></label>
            <label>Answer<textarea rows="5" value={item.answer || ''} onChange={e => setItems(updateItem(items, index, { answer: e.target.value }))} /></label>
            <ItemControls index={index} total={items.length} onMove={(itemIndex, direction) => setItems(moveItem(items, itemIndex, direction))} onRemove={itemIndex => setItems(items.filter((_, faqIndex) => faqIndex !== itemIndex))} />
          </fieldset>
        ))}
      </div>
      <button type="button" className="admin-button admin-button--ghost" onClick={add}>Add question</button>
      <EditorActions pending={pending} />
    </>
  )
}
