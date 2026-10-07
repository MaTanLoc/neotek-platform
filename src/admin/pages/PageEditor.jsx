import {BilingualPanel, EditorTabs} from '../editors/shared/EditorPrimitives'
import {EditorActionBar, SemanticStatus} from '../editors/shared/EditorPrimitives'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {Link, useNavigate, useParams} from 'react-router-dom'
import {Eye, EyeOff, ArrowUp, ArrowDown, ExternalLink, Info} from 'lucide-react'
import {useAuth} from '../auth/useAuth'
import {useCms} from '../app/cmsContext'
import {adminApi} from '../../services/admin/adminApi'
import {useConfirm} from '../app/ConfirmProvider'
import {SelectField} from '../editors/shared/SelectField'
import {resolveEditor} from '../config/sectionRegistry'
import {getSectionMetadata} from '../config/sectionMetadata'
import {getPublicPreviewRoute} from '../config/previewRoutes'

const SECTION_TYPES = ['hero', 'why', 'solutionOverview', 'proofMetrics', 'trustedLogos', 'solutionClusters', 'testimonials', 'cta', 'faq', 'solutionGroups', 'solutionModules']
const emptyState = { loading: true, pending: false, error: '', success: '' }
const pageMetadata = page => ({ slug: page?.slug || '', status: page?.status || 'DRAFT', publishedAt: page?.publishedAt ? page.publishedAt.slice(0, 16) : '' })
const pageTranslations = page => Object.fromEntries((page?.translations || []).map(item => [item.locale, { title: item.title || '', seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || '' }]))
function errorText(error) {
  return ({ 401: 'Phiên đăng nhập đã hết hạn.', 403: 'Bạn không có quyền thực hiện thao tác này.', 404: 'Không tìm thấy nội dung.', 409: 'Giá trị này đã tồn tại.', 429: 'Vui lòng chờ rồi thử lại.' })[error.status] || (error.status >= 500 ? 'Máy chủ đang bận. Vui lòng thử lại sau.' : 'Không thể hoàn tất thao tác. Vui lòng kiểm tra dữ liệu và thử lại.')
}
export function PageEditor() {
  const { slug, sectionKey } = useParams()
  const navigate = useNavigate()
  const { user, csrfToken, clearAuth } = useAuth()
  const { dirty: dirtyRef } = useCms()
  const confirm = useConfirm()
  const [page, setPage] = useState(null)
  const [state, setState] = useState(emptyState)
  const [metadata, setMetadata] = useState({})
  const [translations, setTranslations] = useState({})
  const [drafts, setDrafts] = useState({})
  const [savedDrafts, setSavedDrafts] = useState({})
  const [tab, setTab] = useState('overview')
  const [newSection, setNewSection] = useState({ key: '', type: 'hero' })
  const canManage = user?.role === 'ADMIN'
  const load = useCallback(async () => {
    setState(emptyState)
    try {
      const result = await adminApi.getPage(slug)
      const content = Object.fromEntries((result.sections || []).flatMap(section => (section.translations || []).map(item => [`${section.id}:${item.locale}`, JSON.stringify(item.content ?? {}, null, 2)])))
      setPage(result); setMetadata(pageMetadata(result)); setTranslations(pageTranslations(result)); setDrafts(content); setSavedDrafts(content)
    } catch (error) {
      if (error.status === 401) clearAuth()
      setPage(null); setState(previous => ({ ...previous, error: errorText(error) }))
    } finally { setState(previous => ({ ...previous, loading: false })) }
  }, [slug, clearAuth])
  useEffect(() => { load() }, [load])
  useEffect(() => { setTab('overview') }, [slug, sectionKey])
  const sections = useMemo(() => [...(page?.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder), [page])
  const active = sectionKey ? sections.find(section => section.key === sectionKey || section.type === sectionKey) : null
  const dirty = page !== null && (JSON.stringify(metadata) !== JSON.stringify(pageMetadata(page)) || JSON.stringify(translations) !== JSON.stringify(pageTranslations(page)) || Object.keys(drafts).some(key => drafts[key] !== savedDrafts[key]))
  useEffect(() => { dirtyRef.current = dirty; return () => { dirtyRef.current = false } }, [dirty, dirtyRef])
  useEffect(() => {
    setDrafts(savedDrafts)
    setMetadata(pageMetadata(page))
    setTranslations(pageTranslations(page))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey])
  const save = async operation => {
    setState(previous => ({ ...previous, pending: true, error: '', success: '' }))
    try { await operation(); setState(previous => ({ ...previous, success: 'Đã lưu thay đổi.' })) }
    catch (error) { if (error.status === 401) clearAuth(); setState(previous => ({ ...previous, error: errorText(error) })) }
    finally { setState(previous => ({ ...previous, pending: false })) }
  }
  const discard = async () => { if (!await confirm('Bỏ tất cả thay đổi chưa lưu?')) return; setMetadata(pageMetadata(page)); setTranslations(pageTranslations(page)); setDrafts(savedDrafts); setState(previous => ({ ...previous, error: '', success: '' })) }
  const saveSection = section => save(async () => {
    const viKey = `${section.id}:vi`
    const enKey = `${section.id}:en`
    const viDirty = drafts[viKey] !== savedDrafts[viKey]
    const enDirty = drafts[enKey] !== savedDrafts[enKey]

    if (!viDirty && !enDirty) return

    const viContent = JSON.parse(drafts[viKey] || '{}')
    const enContent = JSON.parse(drafts[enKey] || '{}')

    const result = await adminApi.updateSectionTranslations(
      section.id,
      {
        translations: {
          vi: { content: viContent },
          en: { content: enContent },
        },
      },
      csrfToken,
    )

    const viRaw = JSON.stringify(result.vi?.content ?? viContent, null, 2)
    const enRaw = JSON.stringify(result.en?.content ?? enContent, null, 2)

    setDrafts(previous => ({
      ...previous,
      [viKey]: viRaw,
      [enKey]: enRaw,
    }))
    setSavedDrafts(previous => ({
      ...previous,
      [viKey]: viRaw,
      [enKey]: enRaw,
    }))
  })
  const updateSection = (section, body) => save(async () => {
    const result = await adminApi.updateSection(section.id, body, csrfToken)
    setPage(previous => ({ ...previous, sections: previous.sections.map(item => item.id === section.id ? { ...item, ...result } : item) }))
  })
  const move = (index, direction) => save(async () => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const order = sections.map((section, i) => ({ id: section.id, sortOrder: i === index ? target : i === target ? index : i }))
    const result = await adminApi.reorderSections(page.id, order, csrfToken)
    setPage(result)
  })
  const saveTranslation = event => {
    event.preventDefault()
    save(async () => {
      const [viResult, enResult] = await Promise.all([
        adminApi.updatePageTranslation(page.id, 'vi', translations.vi || { title: '', seoTitle: '', seoDescription: '' }, csrfToken),
        adminApi.updatePageTranslation(page.id, 'en', translations.en || { title: '', seoTitle: '', seoDescription: '' }, csrfToken),
      ])

      const nextVi = {
        title: viResult.title || '',
        seoTitle: viResult.seoTitle || '',
        seoDescription: viResult.seoDescription || '',
      }
      const nextEn = {
        title: enResult.title || '',
        seoTitle: enResult.seoTitle || '',
        seoDescription: enResult.seoDescription || '',
      }

      setTranslations({ vi: nextVi, en: nextEn })
      setPage(previous => ({
        ...previous,
        translations: [
          ...(previous.translations || []).filter(item => item.locale !== 'vi' && item.locale !== 'en'),
          viResult,
          enResult,
        ],
      }))
    })
  }
  const saveMetadata = event => {
    event.preventDefault()
    save(async () => {
      const result = await adminApi.updatePage(page.id, { ...metadata, publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt).toISOString() : null }, csrfToken)
      setPage(previous => ({ ...previous, ...result })); setMetadata(pageMetadata(result))
      if (result.slug !== slug) { dirtyRef.current = false; navigate(`/admin/pages/${result.slug}`, { replace: true }) }
    })
  }
  const addSection = event => {
    event.preventDefault()
    save(async () => {
      const result = await adminApi.createSection(page.id, { ...newSection, sortOrder: (sections.at(-1)?.sortOrder || 0) + 10, enabled: true }, csrfToken)
      setPage(previous => ({ ...previous, sections: [...previous.sections, result] })); setNewSection({ key: '', type: 'hero' })
    })
  }
  if (state.loading) return <p className="admin-muted">Đang tải nội dung trang…</p>
  if (!page) return <p className="admin-alert admin-alert--error" role="alert">{state.error || 'Không tìm thấy trang.'}</p>
  const pageLabel = slug === 'home' ? 'Trang chủ' : slug === 'solutions' ? 'Giải pháp' : page.translations?.find(item => item.locale === 'vi')?.title || slug
  const preview = getPublicPreviewRoute(slug, 'vi')
  const activeDirty = active
    ? (drafts[`${active.id}:vi`] !== savedDrafts[`${active.id}:vi`] ||
      drafts[`${active.id}:en`] !== savedDrafts[`${active.id}:en`])
    : false
  const seoFields = localeKey => <>              <label>
                Tiêu đề trang
                <input
                  required
                  value={translations[localeKey]?.title || ''}
                  onChange={event => setTranslations(previous => ({
                    ...previous,
                    [localeKey]: {
                      ...(previous[localeKey] || {}),
                      title: event.target.value,
                    },
                  }))}
                />
              </label>

              <label>
                Tiêu đề SEO
                <input
                  value={translations[localeKey]?.seoTitle || ''}
                  onChange={event => setTranslations(previous => ({
                    ...previous,
                    [localeKey]: {
                      ...(previous[localeKey] || {}),
                      seoTitle: event.target.value,
                    },
                  }))}
                />
              </label>

              <label>
                Mô tả SEO
                <textarea
                  rows={4}
                  value={translations[localeKey]?.seoDescription || ''}
                  onChange={event => setTranslations(previous => ({
                    ...previous,
                    [localeKey]: {
                      ...(previous[localeKey] || {}),
                      seoDescription: event.target.value,
                    },
                  }))}
                />
              </label>
</>
  return <section className="admin-page-editor">
    <div className="admin-editor-topbar">
      <div>
        <nav className="admin-breadcrumb" aria-label="Vị trí hiện tại"><Link to="/admin/pages">Trang nội dung</Link><span>/</span><Link to={`/admin/pages/${slug}`}>{pageLabel}</Link>{sectionKey && <><span>/</span><strong>{active ? getSectionMetadata(active.type, active.key).label : 'Không tìm thấy mục'}</strong></>}</nav>
        <div className="admin-editor-title">
          <h1>{active ? getSectionMetadata(active.type, active.key).label : pageLabel}</h1>
          <span className="admin-badge">{page.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}</span>

          {active && <div className="admin-title-section-meta">
            <button
              type="button"
              className={`admin-title-icon-button${active.enabled ? ' is-visible' : ''}`}
              aria-label={active.enabled ? 'Ẩn mục khỏi website' : 'Hiển thị mục trên website'}
              title={active.enabled ? 'Đang hiển thị · Bấm để ẩn' : 'Đang ẩn · Bấm để hiển thị'}
              disabled={state.pending}
              onClick={() => updateSection(active, { enabled: !active.enabled })}
            >
              {active.enabled ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
              <span>{active.enabled ? 'Hiển thị' : 'Đang ẩn'}</span>
            </button>

            {active.sharedPages?.length > 1 && <span className="admin-shared-source" title="Thay đổi tại đây áp dụng cho Trang chủ và Giải pháp"><Info size={15} />Dùng chung trên Trang chủ và Giải pháp</span>}
            {<SemanticStatus dirty={activeDirty} pending={state.pending} error={state.error} />}
          </div>}
        </div>
      </div>
      {preview && <a className="admin-button admin-button--ghost admin-button-link" href={preview} target="_blank" rel="noreferrer">Xem trang đã lưu <ExternalLink size={16} aria-hidden="true" /></a>}
    </div>
    {state.error && <p className="admin-alert admin-alert--error" role="alert">{state.error}</p>}
    {state.success && <p className="admin-alert admin-alert--success" role="status">{state.success}</p>}
    {!sectionKey && <EditorTabs value={tab} onChange={setTab} label="Thông tin trang" tabs={[[ 'overview', 'Tổng quan' ], [ 'seo', 'SEO' ], ...(canManage ? [[ 'settings', 'Cài đặt' ]] : [])].map(([key, title]) => [key, title, <>
      {tab === 'overview' && <div className="admin-page-content-list">
        <div className="admin-page-summary"><h2>Các mục nội dung</h2><p className="admin-muted">{sections.length} mục · Chọn một mục để chỉnh sửa. Thông tin tìm kiếm và cài đặt áp dụng cho toàn trang.</p></div>
        {sections.map((section, index) => <div key={section.id} className="admin-section-row">
          <Link to={`/admin/pages/${slug}/${section.key}`}><strong>{getSectionMetadata(section.type, section.key).label}</strong><span>{getSectionMetadata(section.type, section.key).description}</span></Link>
          <span className="admin-badge">{section.enabled ? 'Đang hiển thị' : 'Đã ẩn'}</span>
          <button type="button" className="admin-icon-button" aria-label={`Đưa ${getSectionMetadata(section.type, section.key).label} lên`} disabled={state.pending || index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button>
          <button type="button" className="admin-icon-button" aria-label={`Đưa ${getSectionMetadata(section.type, section.key).label} xuống`} disabled={state.pending || index === sections.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button>
        </div>)}
      </div>}
      {tab === 'seo' && <form className="admin-card admin-editor-block admin-editor-block--flat" onSubmit={saveTranslation}>
        <div className="admin-editor-intro">
          <div>
            <h2>Tiêu đề trang và SEO</h2>
            <p className="admin-muted">Chỉnh Tiếng Việt và English song song.</p>
          </div>
        </div>

        <BilingualPanel vi={seoFields('vi')} en={seoFields('en')} />

        <SaveActions showStatus dirty={dirty} pending={state.pending} error={state.error} onDiscard={discard} />
      </form>}
      {tab === 'settings' && canManage && <div className="admin-settings-column">
        <form className="admin-card admin-editor-block admin-editor-block--flat" onSubmit={saveMetadata}>
          <h2>Cài đặt trang</h2>
          <label>Đường dẫn<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={metadata.slug} onChange={event => setMetadata({ ...metadata, slug: event.target.value })} /></label>
          <label>Trạng thái<SelectField label="Trạng thái" value={metadata.status} onChange={status => setMetadata({ ...metadata, status })} options={[["DRAFT", "Bản nháp"], ["PUBLISHED", "Đã xuất bản"]]} /></label>
          <label>Ngày xuất bản<input type="datetime-local" value={metadata.publishedAt} onChange={event => setMetadata({ ...metadata, publishedAt: event.target.value })} /></label>
          <SaveActions showStatus dirty={dirty} pending={state.pending} error={state.error} onDiscard={discard} />
        </form>
        <details className="admin-card"><summary>Thêm mục nội dung</summary><form className="admin-editor-block" onSubmit={addSection}>
          <label>Mã mục nội dung<input required value={newSection.key} onChange={event => setNewSection({ ...newSection, key: event.target.value })} /></label>
          <label>Loại nội dung<SelectField label="Loại nội dung" value={newSection.type} onChange={type => setNewSection({ ...newSection, type })} options={SECTION_TYPES.map(type => [type, getSectionMetadata(type).label])} /></label>
          <button className="admin-button admin-button--secondary" disabled={state.pending}>Thêm mục</button>
        </form></details>
      </div>}
    </>])} />}
    {sectionKey && (active ? <ActiveSectionEditor
      pairedModuleOptions={sections.find(item => item.type === 'solutionModules')?.translations?.find(item => item.locale === 'en')?.content?.items || []}
      pairedGroupOptions={sections.find(item => item.type === 'solutionGroups')?.translations?.find(item => item.locale === 'en')?.content?.items || []}
      groupOptions={sections.find(item => item.type === 'solutionGroups')?.translations?.find(item => item.locale === 'vi')?.content?.items || []}
      moduleOptions={sections.find(item => item.type === 'solutionModules')?.translations?.find(item => item.locale === 'vi')?.content?.items || []}
      pageSlug={slug}
      key={active.id}
      section={active}
      drafts={drafts}
      savedDrafts={savedDrafts}
      setDrafts={setDrafts}
      onSave={saveSection}
      error={state.error}
      onResetStatus={() => setState(previous => ({ ...previous, error: '', success: '' }))}
      pending={state.pending}
    /> : <p className="admin-card">Mục nội dung này không tồn tại trên trang.</p>)}
  </section>
}
function SaveActions(props) { return <EditorActionBar {...props} /> }
function ActiveSectionEditor({ pageSlug, section, drafts, savedDrafts, setDrafts, onSave, error, pending, moduleOptions, groupOptions, pairedModuleOptions, pairedGroupOptions, onResetStatus }) {
  const confirm = useConfirm()
  const TypedEditor = resolveEditor({ pageSlug, sectionKey: section.key, type: section.type })

  const viTranslation = section.translations?.find(item => item.locale === 'vi')
  const enTranslation = section.translations?.find(item => item.locale === 'en')
  const viKey = `${section.id}:vi`
  const enKey = `${section.id}:en`
  const viRaw = drafts[viKey] ?? JSON.stringify(viTranslation?.content ?? {}, null, 2)
  const enRaw = drafts[enKey] ?? JSON.stringify(enTranslation?.content ?? {}, null, 2)
  const dirty = viRaw !== savedDrafts[viKey] || enRaw !== savedDrafts[enKey]

  const discardSection = async () => {
    if (!await confirm('Bỏ thay đổi chưa lưu của mục này?')) return
    setDrafts(previous => ({
      ...previous,
      [viKey]: savedDrafts[viKey],
      [enKey]: savedDrafts[enKey],
    }))
    onResetStatus()
  }

  let viValue
  let enValue
  try { viValue = JSON.parse(viRaw) } catch { viValue = {} }
  try { enValue = JSON.parse(enRaw) } catch { enValue = {} }

  useEffect(() => {
    const handleKeyDown = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (dirty && !pending) onSave(section)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dirty, onSave, pending, section])

  return <article className="admin-section-editor">
    <form
      className="admin-section-form"
      onSubmit={event => {
        event.preventDefault()
        onSave(section)
      }}
    >
      <fieldset className="admin-editor-fields" disabled={pending}>
        {TypedEditor ? <TypedEditor
          groupOptions={groupOptions}
          pairedGroupOptions={pairedGroupOptions}
          pairedModuleOptions={pairedModuleOptions}
          moduleOptions={moduleOptions}
          pageSlug={pageSlug}
          sectionKey={section.key}
          value={viValue}
          locale="vi"
          pairedValue={enValue}
          pending={pending}
          onChange={next => setDrafts(previous => ({
            ...previous,
            [viKey]: JSON.stringify(next, null, 2),
          }))}
          onPairedChange={next => setDrafts(previous => ({
            ...previous,
            [enKey]: JSON.stringify(next, null, 2),
          }))}
          error={error}
          dirty={dirty}
          onDiscard={discardSection}
          onSave={() => onSave(section)}
        /> : <p className="admin-muted">Chưa có trình chỉnh sửa phù hợp. Vui lòng liên hệ quản trị viên.</p>}
      </fieldset>

      {(section.type !== 'hero' || pageSlug === 'solutions') && (
        <div className="admin-section-bottom-actions">
          <SaveActions
            dirty={dirty}
            pending={pending}
            onDiscard={discardSection}
            error={error}
          />
        </div>
      )}
    </form>
  </article>
}
