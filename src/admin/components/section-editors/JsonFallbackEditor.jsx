import { EditorActions } from './EditorControls'

export function JsonFallbackEditor({ value, onChange, pending }) {
  return (
    <>
      <div className="admin-advanced-warning">
        <strong>Advanced content editor</strong>
        <span>This section does not yet have a visual form. Edit JSON only if you understand its structure.</span>
      </div>
      <label>Content JSON<textarea aria-label="Content JSON" className="admin-json-editor" rows="12" value={value} onChange={onChange} /></label>
      <EditorActions pending={pending} />
    </>
  )
}
