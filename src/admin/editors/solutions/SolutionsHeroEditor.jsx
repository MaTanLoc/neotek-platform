import {SolutionsHeroView} from '../shared/PublicPreviewViews'
import {useState} from 'react'
import {EditorTabs, CtaRow, BilingualPanel, EditorPanel} from '../shared/EditorPrimitives'
import {DraftPreviewPanel} from '../shared/DraftPreviewPanel'
import {heroDraft} from '../../utils/content'
import {MediaField} from '../shared/MediaField'
import {RichTextField} from '../shared/RichTextField'

export function SolutionsHeroEditor({ value, pairedValue, onChange, onPairedChange, pending }) {
  const [tab, setTab] = useState('content')
  const vi = value || {}, en = pairedValue || {}
  const a = vi?.slides?.[0], b = en?.slides?.[0]
  const write = (nextVi, nextEn) => { onChange(nextVi); onPairedChange(nextEn) }
  const update = (language, patch) => {
    const source = language === 'vi' ? vi : en
    const next = { ...source, slides: [{ ...source.slides[0], ...patch }, ...source.slides.slice(1)] }
    write(language === 'vi' ? next : vi, language === 'en' ? next : en)
  }
  const shared = patch => write({ ...vi, slides: [{ ...a, ...patch }, ...(vi?.slides || []).slice(1)] }, { ...en, slides: [{ ...b, ...patch }, ...(en?.slides || []).slice(1)] })
  if (!a || !b) return <div><p>Banner cần bản VI và EN để chỉnh sửa song ngữ.</p><button type="button" className="admin-button admin-button--secondary" onClick={() => {
    const key = a?.key || b?.key || `hero-${crypto.randomUUID()}`
    const blank = { key, showContent: true, primaryCta: {}, secondaryCta: {} }
    write(a ? vi : { ...vi, slides: [{ ...blank }] }, b ? en : { ...en, slides: [{ ...blank }] })
  }}>Tạo bản còn thiếu</button></div>
  const fields = (language, slide) => <>
      {[['eyebrow', 'Dòng giới thiệu'], ['titleLine1', 'Tiêu đề dòng đầu'], ['titleHighlight', 'Phần nhấn mạnh']].map(([key, label]) => <label key={key}>{label}{key === 'eyebrow' ? <input value={slide[key] || (key === 'titleLine1' ? slide.headline : '') || ''} onChange={event => update(language, { [key]: event.target.value })} /> : <textarea rows={2} value={slide[key] || (key === 'titleLine1' ? slide.headline : '') || ''} onChange={event => update(language, { [key]: event.target.value })} />}</label>)}
      <RichTextField label="Mô tả" value={slide.description || ''} disabled={pending} onChange={description => update(language, { description })} />

  </>
  return <div className="admin-standard-editor">
    <EditorTabs value={tab} onChange={setTab} tabs={[
      ['content', 'N\u1ed9i dung', <BilingualPanel vi={fields('vi', a)} en={fields('en', b)} />],
      ['media', 'Hình ảnh', (<EditorPanel media><MediaField label="Hình minh họa bên phải" value={a.desktopImage || b.desktopImage || ''} disabled={pending} onChange={desktopImage => shared({ desktopImage })} /></EditorPanel>)],
      ['actions', 'N\u00fat h\u00e0nh \u0111\u1ed9ng', <div className="admin-editor-group">{['primaryCta', 'secondaryCta'].map(name => <CtaRow key={name} kind={name === 'primaryCta' ? 'N\u00fat ch\u00ednh' : 'N\u00fat ph\u1ee5'} vi={a[name]} en={b[name]} disabled={pending} enabled={a[name]?.enabled !== false} onLabelChange={(language, label) => update(language, { [name]: { ...(language === 'vi' ? a : b)[name], label } })} onSharedChange={patch => write({ ...vi, slides: [{ ...a, [name]: { ...a[name], ...patch } }, ...vi.slides.slice(1)] }, { ...en, slides: [{ ...b, [name]: { ...b[name], ...patch } }, ...en.slides.slice(1)] })} />)}</div>]
    ]} />
<EditorPanel title="Preview"><BilingualPanel vi={preview('vi', a)} en={preview('en', b)} /></EditorPanel>
  </div>
  function preview(language, slide) { return <DraftPreviewPanel label={language + ' Solutions hero draft'}><SolutionsHeroView hero={heroDraft(slide)} language={language} titleId={'admin-solutions-hero-' + language} /></DraftPreviewPanel> }
}
