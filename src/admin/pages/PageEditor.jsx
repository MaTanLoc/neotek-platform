import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { adminApi } from '../../services/admin/adminApi'
import { JsonFallbackEditor } from '../components/section-editors/JsonFallbackEditor'
import { sectionEditors } from '../components/section-editors/registry'

const SECTION_TYPES = ['hero', 'why', 'solutionOverview', 'proofMetrics', 'trustedLogos', 'solutionClusters', 'testimonials', 'cta', 'faq', 'solutionGroups', 'solutionModules']
const EMPTY = { loading: true, pending: false, error: '', success: '' }

export function PageEditor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, csrfToken, clearAuth } = useAuth()
  const [page, setPage] = useState(null)
  const [state, setState] = useState(EMPTY)
  const [metadata, setMetadata] = useState({})
  const [translationDrafts, setTranslationDrafts] = useState({})
  const [sectionDrafts, setSectionDrafts] = useState({})
  const [newSection, setNewSection] = useState({ key: '', type: SECTION_TYPES[0], sortOrder: 0, enabled: true })

  const load = useCallback(async () => {
    setState({ ...EMPTY, loading: true })
    try {
      const result = await adminApi.getPage(slug)
      setPage(result)
      setMetadata({ slug: result.slug, status: result.status, publishedAt: result.publishedAt ? result.publishedAt.slice(0, 16) : '' })
      setTranslationDrafts(Object.fromEntries((result.translations || []).map(item => [item.locale, { title: item.title || '', seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || '' }])))
      setSectionDrafts(Object.fromEntries((result.sections || []).flatMap(section => (section.translations || []).map(item => [`${section.id}:${item.locale}`, JSON.stringify(item.content ?? {}, null, 2)]))))
    } catch (error) {
      if (error.status === 401) clearAuth()
      setState({ ...EMPTY, loading: false, error: error.message })
    } finally { setState(previous => ({ ...previous, loading: false })) }
  }, [clearAuth, slug])
  useEffect(() => { load() }, [load])

  const save = async (operation, success = 'Saved.') => {
    setState(previous => ({ ...previous, pending: true, error: '', success: '' }))
    try { const result = await operation(); setState(previous => ({ ...previous, success })); return result }
    catch (error) { if (error.status === 401) clearAuth(); setState(previous => ({ ...previous, error: error.message, success: '' })); return null }
    finally { setState(previous => ({ ...previous, pending: false })) }
  }

  const saveMetadata = async (event) => {
    event.preventDefault()
    const result = await save(() => adminApi.updatePage(page.id, { slug: metadata.slug, status: metadata.status, publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt).toISOString() : null }, csrfToken))
    if (result && metadata.slug !== slug) navigate(`/admin/pages/${result.slug}`, { replace: true })
    else if (result) load()
  }

  const saveTranslation = (locale) => save(async () => {
    const result = await adminApi.updatePageTranslation(page.id, locale, translationDrafts[locale], csrfToken)
    setPage(previous => ({ ...previous, translations: previous.translations.map(item => item.locale === locale ? result : item) }))
    return result
  })

  const saveSection = (section, locale, draftValue) => save(async () => {
    const key = `${section.id}:${locale}`
    let content
    try { content = draftValue ?? JSON.parse(sectionDrafts[key]) } catch { throw new Error('Invalid JSON. Fix the content before saving.') }
    const result = await adminApi.updateSectionTranslation(section.id, locale, { content }, csrfToken)
    setSectionDrafts(previous => ({ ...previous, [key]: JSON.stringify(result.content ?? content, null, 2) }))
    return result
  })

  const updateSection = (section, body) => save(async () => {
    const result = await adminApi.updateSection(section.id, body, csrfToken)
    setPage(previous => ({ ...previous, sections: previous.sections.map(item => item.id === section.id ? { ...item, ...result } : item) }))
    return result
  })

  const move = (index, direction) => {
    const sections = [...page.sections].sort((a, b) => a.sortOrder - b.sortOrder)
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const order = sections.map((section, itemIndex) => ({ id: section.id, sortOrder: itemIndex === index ? target : itemIndex === target ? index : itemIndex }))
    save(async () => { const result = await adminApi.reorderSections(page.id, order, csrfToken); setPage(result); return result })
  }

  const createSection = async (event) => {
    event.preventDefault()
    const result = await save(() => adminApi.createSection(page.id, { ...newSection, sortOrder: Number(newSection.sortOrder) }, csrfToken), 'Section created.')
    if (result) load()
  }

  if (state.loading) return <p className="admin-muted">Loading page…</p>
  if (!page) return <div className="admin-alert admin-alert--error">{state.error || 'Page not found.'}</div>
  const canManage = user?.role === 'ADMIN'
  const sections = [...(page.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder)

  return <section>
    <Link className="admin-back" to="/admin/pages">← Back to pages</Link>
    <div className="admin-page-heading"><div><p className="admin-kicker">Page editor</p><h1>{page.slug}</h1></div><span className="admin-badge">{page.status}</span></div>
    {state.error && <div className="admin-alert admin-alert--error" role="alert">{state.error}</div>}
    {state.success && <div className="admin-alert admin-alert--success" role="status">{state.success}</div>}
    {canManage && <form className="admin-card admin-form-grid" onSubmit={saveMetadata}><h2>Page metadata</h2>
      <label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={metadata.slug || ''} onChange={e => setMetadata({ ...metadata, slug: e.target.value })} /></label>
      <label>Status<select value={metadata.status || ''} onChange={e => setMetadata({ ...metadata, status: e.target.value })}><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option></select></label>
      <label>Published at<input type="datetime-local" value={metadata.publishedAt || ''} onChange={e => setMetadata({ ...metadata, publishedAt: e.target.value })} /></label>
      <button className="admin-button admin-button--primary">Save metadata</button>
    </form>}
    <div className="admin-card"><h2>Translations</h2>{(page.translations || []).map(translation => <form className="admin-editor-block" key={translation.locale} onSubmit={e => { e.preventDefault(); saveTranslation(translation.locale) }}>
      <h3>{translation.locale}</h3><label>Title<input required value={translationDrafts[translation.locale]?.title || ''} onChange={e => setTranslationDrafts({ ...translationDrafts, [translation.locale]: { ...translationDrafts[translation.locale], title: e.target.value } })} /></label>
      <label>SEO title<input value={translationDrafts[translation.locale]?.seoTitle || ''} onChange={e => setTranslationDrafts({ ...translationDrafts, [translation.locale]: { ...translationDrafts[translation.locale], seoTitle: e.target.value } })} /></label>
      <label>SEO description<textarea rows="3" value={translationDrafts[translation.locale]?.seoDescription || ''} onChange={e => setTranslationDrafts({ ...translationDrafts, [translation.locale]: { ...translationDrafts[translation.locale], seoDescription: e.target.value } })} /></label>
      <button className="admin-button admin-button--secondary">Save translation</button>
    </form>)}</div>
    <div className="admin-page-heading"><h2>Sections</h2>{canManage && <form className="admin-inline-form" onSubmit={createSection}><input aria-label="Section key" placeholder="Section key (e.g. hero)" required value={newSection.key} onChange={e => setNewSection({ ...newSection, key: e.target.value })} /><select aria-label="Section type" value={newSection.type} onChange={e => setNewSection({ ...newSection, type: e.target.value })}>{SECTION_TYPES.map(type => <option key={type}>{type}</option>)}</select><button className="admin-button admin-button--primary">Add section</button></form>}</div>
    {sections.length === 0 ? <div className="admin-card">No sections found.</div> : sections.map((section, index) => <SectionCard key={section.id} section={section} index={index} total={sections.length} drafts={sectionDrafts} setDrafts={setSectionDrafts} onSave={saveSection} onUpdate={updateSection} onMove={move} pending={state.pending} />)}
  </section>
}

function SectionCard({ section, index, total, drafts, setDrafts, onSave, onUpdate, onMove, pending }) {
  const TypedEditor = sectionEditors[section.type]
  return <article className="admin-card admin-section-card"><div className="admin-section-heading"><div><h3>{section.key}</h3><span className="admin-muted">Section type: {section.type} · Display order: {section.sortOrder}</span><p className="admin-muted">Section key is an internal identifier and normally should not be changed.</p></div><label className="admin-checkbox"><input type="checkbox" checked={section.enabled} onChange={e => onUpdate(section, { enabled: e.target.checked })} /> Visible</label></div>
    <div className="admin-order-controls"><button type="button" className="admin-button admin-button--ghost" disabled={index === 0} onClick={() => onMove(index, -1)}>Move up</button><button type="button" className="admin-button admin-button--ghost" disabled={index === total - 1} onClick={() => onMove(index, 1)}>Move down</button></div>
    {(section.translations || []).map(translation => { const key = `${section.id}:${translation.locale}`; const raw = drafts[key] || JSON.stringify(translation.content ?? {}, null, 2); let value; try { value = JSON.parse(raw) } catch { value = null } return <form className="admin-editor-block" key={key} onSubmit={e => { e.preventDefault(); onSave(section, translation.locale) }}><h4>{translation.locale} content</h4>{TypedEditor && value !== null ? <TypedEditor value={value} pending={pending} onChange={next => setDrafts(previous => ({ ...previous, [key]: JSON.stringify(next, null, 2) }))} /> : <JsonFallbackEditor value={raw} onChange={e => setDrafts(previous => ({ ...previous, [key]: e.target.value }))} pending={pending} />}</form> })}
  </article>
}
