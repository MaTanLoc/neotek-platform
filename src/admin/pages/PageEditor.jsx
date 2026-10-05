import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { adminApi } from '../../services/admin/adminApi'
import { JsonFallbackEditor } from '../components/section-editors/JsonFallbackEditor'
import { sectionEditors } from '../components/section-editors/registry'
import { getLocaleLabel, getSectionMetadata } from '../sectionMetadata'
import { getPublicPreviewRoute } from '../previewRoutes'

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
  const [savedSectionDrafts, setSavedSectionDrafts] = useState({})
  const [activeLocale, setActiveLocale] = useState('vi')
  const [previewKey, setPreviewKey] = useState(0)
  const [newSection, setNewSection] = useState({ key: '', type: SECTION_TYPES[0], sortOrder: 0, enabled: true })
  const sectionRefs = useRef({})

  const load = useCallback(async () => {
    setState({ ...EMPTY, loading: true })
    try {
      const result = await adminApi.getPage(slug)
      const drafts = Object.fromEntries((result.sections || []).flatMap(section => (section.translations || []).map(item => [`${section.id}:${item.locale}`, JSON.stringify(item.content ?? {}, null, 2)])))
      setPage(result)
      setMetadata({ slug: result.slug, status: result.status, publishedAt: result.publishedAt ? result.publishedAt.slice(0, 16) : '' })
      setTranslationDrafts(Object.fromEntries((result.translations || []).map(item => [item.locale, { title: item.title || '', seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || '' }])))
      setSectionDrafts(drafts)
      setSavedSectionDrafts(drafts)
      setActiveLocale(previous => (result.translations || []).some(item => item.locale === previous) ? previous : result.translations?.[0]?.locale || 'vi')
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
    const saved = JSON.stringify(result.content ?? content, null, 2)
    setSectionDrafts(previous => ({ ...previous, [key]: saved }))
    setSavedSectionDrafts(previous => ({ ...previous, [key]: saved }))
    setPreviewKey(previous => previous + 1)
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

  const locales = page?.translations?.map(item => item.locale) || []
  const sections = useMemo(() => [...(page?.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder), [page])
  const previewRoute = getPublicPreviewRoute(page?.slug, activeLocale)
  const canManage = user?.role === 'ADMIN'

  if (state.loading) return <p className="admin-muted">Loading page…</p>
  if (!page) return <div className="admin-alert admin-alert--error">{state.error || 'Page not found.'}</div>

  const scrollToSection = id => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return <section>
    <Link className="admin-back" to="/admin/pages">← Back to pages</Link>
    <div className="admin-page-heading"><div><p className="admin-kicker">Page editor</p><h1>{page.translations?.find(item => item.locale === activeLocale)?.title || page.slug}</h1><p className="admin-muted">/{page.slug} · {getLocaleLabel(activeLocale)}</p></div><span className="admin-badge">{page.status}</span></div>
    {state.error && <div className="admin-alert admin-alert--error" role="alert">{state.error}</div>}
    {state.success && <div className="admin-alert admin-alert--success" role="status">{state.success}</div>}
    <div className="admin-locale-tabs" role="tablist" aria-label="Editing language">{locales.map(locale => <button key={locale} type="button" role="tab" aria-selected={activeLocale === locale} className={`admin-locale-tab${activeLocale === locale ? ' is-active' : ''}`} onClick={() => setActiveLocale(locale)}>{getLocaleLabel(locale)}</button>)}</div>
    <div className="admin-editor-layout">
      <div className="admin-editor-column">
        {canManage && <form className="admin-card admin-form-grid" onSubmit={saveMetadata}><h2>Page settings</h2><label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={metadata.slug || ''} onChange={e => setMetadata({ ...metadata, slug: e.target.value })} /></label><label>Status<select value={metadata.status || ''} onChange={e => setMetadata({ ...metadata, status: e.target.value })}><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option></select></label><label>Published at<input type="datetime-local" value={metadata.publishedAt || ''} onChange={e => setMetadata({ ...metadata, publishedAt: e.target.value })} /></label><button className="admin-button admin-button--primary">Save page settings</button></form>}
        <div className="admin-card"><h2>Translation and SEO · {getLocaleLabel(activeLocale)}</h2>{(page.translations || []).filter(translation => translation.locale === activeLocale).map(translation => <form className="admin-editor-block" key={translation.locale} onSubmit={e => { e.preventDefault(); saveTranslation(translation.locale) }}><label>Page title<input required value={translationDrafts[translation.locale]?.title || ''} onChange={e => setTranslationDrafts({ ...translationDrafts, [translation.locale]: { ...translationDrafts[translation.locale], title: e.target.value } })} /></label><label>SEO title<input value={translationDrafts[translation.locale]?.seoTitle || ''} onChange={e => setTranslationDrafts({ ...translationDrafts, [translation.locale]: { ...translationDrafts[translation.locale], seoTitle: e.target.value } })} /></label><label>SEO description<textarea rows="3" value={translationDrafts[translation.locale]?.seoDescription || ''} onChange={e => setTranslationDrafts({ ...translationDrafts, [translation.locale]: { ...translationDrafts[translation.locale], seoDescription: e.target.value } })} /></label><button className="admin-button admin-button--secondary">Save translation and SEO</button></form>)}</div>
        <div className="admin-card admin-section-navigator"><h2>Page content</h2><p className="admin-muted">Choose a section to jump to it.</p><ol>{sections.map(section => <li key={section.id}><button type="button" onClick={() => scrollToSection(section.id)}>{getSectionMetadata(section.type).label}</button></li>)}</ol></div>
        <div className="admin-page-heading"><h2>Sections</h2>{canManage && <form className="admin-inline-form" onSubmit={createSection}><label>Section key<input aria-label="Section key" placeholder="e.g. hero, faq, cta" required value={newSection.key} onChange={e => setNewSection({ ...newSection, key: e.target.value })} /><small>Internal identifier for this content block.</small></label><label>Section type<select aria-label="Section type" value={newSection.type} onChange={e => setNewSection({ ...newSection, type: e.target.value })}>{SECTION_TYPES.map(type => <option key={type}>{type}</option>)}</select><small>Determines the editor and frontend component.</small></label><button className="admin-button admin-button--primary">Add section</button></form>}</div>
        {sections.length === 0 ? <div className="admin-card">No sections found.</div> : sections.map((section, index) => <SectionCard key={section.id} section={section} index={index} total={sections.length} locale={activeLocale} drafts={sectionDrafts} savedDrafts={savedSectionDrafts} setDrafts={setSectionDrafts} onSave={saveSection} onUpdate={updateSection} onMove={move} pending={state.pending} sectionRef={element => { sectionRefs.current[section.id] = element }} />)}
      </div>
      <PreviewPanel locale={activeLocale} route={previewRoute} previewKey={previewKey} />
    </div>
  </section>
}

function SectionCard({ section, index, total, locale, drafts, savedDrafts, setDrafts, onSave, onUpdate, onMove, pending, sectionRef }) {
  const TypedEditor = sectionEditors[section.type]
  const metadata = getSectionMetadata(section.type)
  const translation = section.translations?.find(item => item.locale === locale)
  if (!translation) return null
  const key = `${section.id}:${locale}`
  const raw = drafts[key] || JSON.stringify(translation.content ?? {}, null, 2)
  const dirty = raw !== savedDrafts[key]
  let value
  try { value = JSON.parse(raw) } catch { value = null }
  return <article ref={sectionRef} className="admin-card admin-section-card" id={`section-${section.id}`}><div className="admin-section-heading"><div><h3>{metadata.label}</h3><p className="admin-muted">{metadata.description}</p><span className="admin-muted">Display order: {section.sortOrder}</span></div><label className="admin-checkbox"><input type="checkbox" checked={section.enabled} onChange={e => onUpdate(section, { enabled: e.target.checked })} /> Visible on website</label></div><details className="admin-technical-details"><summary>Advanced / Technical details</summary><div><span>Section key: {section.key}</span><span>Section type: {section.type}</span>{section.id && <span>Section ID: {section.id}</span>}</div></details><div className="admin-order-controls"><button type="button" className="admin-button admin-button--ghost" disabled={index === 0} onClick={() => onMove(index, -1)}>Move up</button><button type="button" className="admin-button admin-button--ghost" disabled={index === total - 1} onClick={() => onMove(index, 1)}>Move down</button></div><form className="admin-editor-block" onSubmit={e => { e.preventDefault(); onSave(section, locale) }}><h4>{getLocaleLabel(locale)} content</h4><span className={`admin-save-state${dirty ? ' is-dirty' : ''}`}>{dirty ? 'Unsaved changes' : 'Saved'}</span>{TypedEditor && value !== null ? <TypedEditor value={value} pending={pending} onChange={next => setDrafts(previous => ({ ...previous, [key]: JSON.stringify(next, null, 2) }))} /> : <JsonFallbackEditor value={raw} onChange={e => setDrafts(previous => ({ ...previous, [key]: e.target.value }))} pending={pending} />}</form></article>
}

function PreviewPanel({ locale, route, previewKey }) {
  const [frameKey, setFrameKey] = useState(previewKey)
  useEffect(() => setFrameKey(previewKey), [previewKey])
  const url = route ? `${route}?preview=${frameKey}` : ''
  return <aside className="admin-preview-panel"><div className="admin-preview-header"><div><h2>Website preview</h2><span className="admin-muted">{getLocaleLabel(locale)} · saved content only</span></div>{route && <div className="admin-preview-actions"><button type="button" className="admin-button admin-button--ghost" onClick={() => setFrameKey(value => value + 1)}>Refresh preview</button><a className="admin-button admin-button--secondary" href={route} target="_blank" rel="noreferrer">Open in new tab</a></div>}</div>{route ? <iframe key={url} title={`Saved ${getLocaleLabel(locale)} website preview`} src={url} className="admin-preview-frame" /> : <div className="admin-preview-empty">Public preview is not available for this page.</div>}</aside>
}
