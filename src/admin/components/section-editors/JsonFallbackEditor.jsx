import { EditorActions } from './EditorControls'

export function JsonFallbackEditor({ value, onChange, pending }) {
  return (
    <>
      <label>Content JSON<textarea className="admin-json-editor" rows="12" value={value} onChange={onChange} /></label>
      <EditorActions pending={pending} />
    </>
  )
}
