import { EditorActions, ItemControls } from './EditorControls'
import { moveItem, updateItem } from './editorUtils'

const emptyAction = { enabled: true, label: '', url: '' }
const emptySlide = { key: '', showContent: true, eyebrow: '', headline: '', description: '', desktopImage: '', mobileImage: '', imagePosition: '', mobileImagePosition: '', overlay: '', contentPosition: '', primaryCta: emptyAction, secondaryCta: emptyAction }

function updateAction(slide, name, patch) {
  return { ...slide, [name]: { ...emptyAction, ...(slide[name] || {}), ...patch } }
}

export function HeroEditor({ value, onChange, pending }) {
  const slides = Array.isArray(value?.slides) ? value.slides : []
  const setSlides = (next) => onChange({ ...value, slides: next })
  const update = (index, patch) => setSlides(updateItem(slides, index, patch))
  const add = () => setSlides([...slides, { ...emptySlide, primaryCta: { ...emptyAction }, secondaryCta: { ...emptyAction } }])

  return (
    <>
      <div className="admin-editor-items">
        {slides.map((slide, index) => (
          <fieldset className="admin-editor-item" key={`${slide.key || 'slide'}-${index}`}>
            <legend>Slide {index + 1}</legend>
            <div className="admin-form-grid admin-form-grid--two">
              <label>Internal key<input value={slide.key || ''} onChange={e => update(index, { key: e.target.value })} /></label>
              <label>Eyebrow<input value={slide.eyebrow || ''} onChange={e => update(index, { eyebrow: e.target.value })} /></label>
              <label>Headline<input value={slide.headline || ''} onChange={e => update(index, { headline: e.target.value })} /></label>
              <label>Desktop image URL<input value={slide.desktopImage || ''} onChange={e => update(index, { desktopImage: e.target.value })} /></label>
              <label>Mobile image URL<input value={slide.mobileImage || ''} onChange={e => update(index, { mobileImage: e.target.value })} /></label>
              <label>Image position<input value={slide.imagePosition || ''} onChange={e => update(index, { imagePosition: e.target.value })} /></label>
            </div>
            <label>Description<textarea rows="3" value={slide.description || ''} onChange={e => update(index, { description: e.target.value })} /></label>
            <div className="admin-form-grid admin-form-grid--two">
              {['primaryCta', 'secondaryCta'].map((name, actionIndex) => (
                <fieldset className="admin-editor-subitem" key={name}>
                  <legend>{actionIndex === 0 ? 'Primary button' : 'Secondary button'}</legend>
                  <label>Label<input value={slide[name]?.label || ''} onChange={e => update(index, { [name]: updateAction(slide, name, { label: e.target.value })[name] })} /></label>
                  <label>URL<input value={slide[name]?.url || ''} onChange={e => update(index, { [name]: updateAction(slide, name, { url: e.target.value })[name] })} /></label>
                  <label className="admin-checkbox"><input type="checkbox" checked={slide[name]?.enabled !== false} onChange={e => update(index, { [name]: updateAction(slide, name, { enabled: e.target.checked })[name] })} /> Enabled</label>
                </fieldset>
              ))}
            </div>
            <label className="admin-checkbox"><input type="checkbox" checked={slide.showContent !== false} onChange={e => update(index, { showContent: e.target.checked })} /> Show content</label>
            <ItemControls index={index} total={slides.length} onMove={(itemIndex, direction) => setSlides(moveItem(slides, itemIndex, direction))} onRemove={itemIndex => setSlides(slides.filter((_, slideIndex) => slideIndex !== itemIndex))} />
          </fieldset>
        ))}
      </div>
      <button type="button" className="admin-button admin-button--ghost" onClick={add}>Add slide</button>
      <EditorActions pending={pending} />
    </>
  )
}
