export function ItemControls({ index, total, onMove, onRemove }) {
  return (
    <div className="admin-item-controls">
      <button type="button" className="admin-button admin-button--ghost" disabled={index === 0} onClick={() => onMove(index, -1)}>Move up</button>
      <button type="button" className="admin-button admin-button--ghost" disabled={index === total - 1} onClick={() => onMove(index, 1)}>Move down</button>
      <button type="button" className="admin-button admin-button--ghost" onClick={() => onRemove(index)}>Remove</button>
    </div>
  )
}

export function EditorActions({ pending }) {
  return <button type="submit" className="admin-button admin-button--secondary" disabled={pending}>{pending ? 'Saving…' : 'Save content'}</button>
}
