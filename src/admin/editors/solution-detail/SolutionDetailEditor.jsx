import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Dialog } from 'radix-ui'
import { ExternalLink, X } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { useCms } from '../../app/cmsContext'
import { useConfirm } from '../../app/ConfirmProvider'
import { adminApi } from '../../../services/admin/adminApi'
import {
  EditorTabs,
  BilingualPanel,
  SemanticStatus,
} from '../shared/EditorPrimitives'
import { MediaField } from '../shared/MediaField'
import { ArticleEditor } from './ArticleEditor'
import { SolutionArticleView } from '../../../pages/solutions/SolutionArticleView'
import '../../../pages/solutions/SolutionDetailPage.css'
import '../../styles/admin-solution-detail.css'

const locales = ['vi', 'en']
function pageDraft(page) {
  const content = (key, locale) =>
    page.sections
      .find((section) => section.key === key)
      ?.translations.find((item) => item.locale === locale)?.content
  return {
    slug: page.slug,
    status: page.status,
    visible: page.sections
      .filter((section) => ['hero', 'article'].includes(section.key))
      .every((section) => section.enabled),
    publishedAt: page.publishedAt || null,
    related: content('related', 'vi') || { moduleKeys: [] },
    translations: Object.fromEntries(
      locales.map((locale) => {
        const translation = page.translations.find(
          (item) => item.locale === locale,
        )
        return [
          locale,
          {
            title: translation?.title || '',
            seoTitle: translation?.seoTitle || null,
            seoDescription: translation?.seoDescription || null,
            hero: content('hero', locale),
            article: content('article', locale),
          },
        ]
      }),
    ),
  }
}
function mirrorSharedNodes(previous, next, other) {
  const old = new Map(),
    patches = new Map()
  const visit = (node, callback) => {
    callback(node)
    node.content?.forEach((child) => visit(child, callback))
  }
  visit(previous.doc, (node) => {
    if (node.attrs?.id) old.set(node.attrs.id, node.attrs)
  })
  visit(next.doc, (node) => {
    if (!old.has(node.attrs?.id)) return
    const attrs = old.get(node.attrs.id)
    const keys =
      node.type === 'articleImage'
        ? ['src', 'display']
        : node.type === 'articleCta'
          ? ['url', 'style', 'placement']
          : []
    const patch = Object.fromEntries(
      keys
        .filter((key) => attrs[key] !== node.attrs[key])
        .map((key) => [key, node.attrs[key]]),
    )
    if (Object.keys(patch).length) patches.set(node.attrs.id, patch)
  })
  if (!patches.size) return other
  const clone = structuredClone(other)
  visit(clone.doc, (node) => {
    if (patches.has(node.attrs?.id))
      Object.assign(node.attrs, patches.get(node.attrs.id))
  })
  return clone
}
export default function SolutionDetailEditor() {
  const { slug } = useParams(),
    navigate = useNavigate(),
    { csrfToken, clearAuth } = useAuth(),
    { dirty: dirtyRef } = useCms(),
    confirm = useConfirm()
  const [page, setPage] = useState(null),
    [model, setModel] = useState(null),
    [saved, setSaved] = useState(null),
    [modules, setModules] = useState([]),
    [locale, setLocale] = useState('vi'),
    [tab, setTab] = useState('content'),
    [state, setState] = useState({ loading: true }),
    [preview, setPreview] = useState(false)
  const saveRef = useRef(null)
  const [uploads, setUploads] = useState({})
  const uploading = Object.values(uploads).some(Boolean)
  const articleBusy = useCallback(
    (busy) => setUploads((previous) => ({ ...previous, article: busy })),
    [],
  )
  useEffect(() => {
    let active = true
    setState({ loading: true })
    Promise.all([
      adminApi.getSolutionDetail(slug),
      adminApi.getPage('solutions'),
    ])
      .then(([detail, listing]) => {
        if (!active) return
        const draft = pageDraft(detail)
        setPage(detail)
        setModel(draft)
        setSaved(draft)
        setModules(
          listing.sections
            .find((section) => section.type === 'solutionModules')
            ?.translations.find((item) => item.locale === 'vi')?.content
            .items || [],
        )
        setState({})
      })
      .catch((error) => {
        if (active) {
          if (error.status === 401) clearAuth()
          setState({
            error:
              error.status === 404
                ? 'Không tìm thấy trang chi tiết.'
                : 'Không thể tải trang chi tiết. Vui lòng thử lại.',
          })
        }
      })
    return () => {
      active = false
    }
  }, [slug, clearAuth])
  const dirty = model && JSON.stringify(model) !== JSON.stringify(saved)
  useEffect(() => {
    dirtyRef.current = !!dirty || uploading
    return () => {
      dirtyRef.current = false
    }
  }, [dirty, uploading, dirtyRef])
  const updateLocale = (language, patch) =>
    setModel((previous) => ({
      ...previous,
      translations: {
        ...previous.translations,
        [language]: { ...previous.translations[language], ...patch },
      },
    }))
  const updateHero = (language, patch) =>
    setModel((previous) => ({
      ...previous,
      translations: {
        ...previous.translations,
        [language]: {
          ...previous.translations[language],
          hero: { ...previous.translations[language].hero, ...patch },
        },
      },
    }))
  const sharedHero = (patch) =>
    setModel((previous) => ({
      ...previous,
      translations: Object.fromEntries(
        locales.map((language) => [
          language,
          {
            ...previous.translations[language],
            hero: { ...previous.translations[language].hero, ...patch },
          },
        ]),
      ),
    }))
  const updateArticle = useCallback(
    (article) =>
      setModel((previous) => {
        const other = locale === 'vi' ? 'en' : 'vi'
        return {
          ...previous,
          translations: {
            ...previous.translations,
            [locale]: { ...previous.translations[locale], article },
            [other]: {
              ...previous.translations[other],
              article: mirrorSharedNodes(
                previous.translations[locale].article,
                article,
                previous.translations[other].article,
              ),
            },
          },
        }
      }),
    [locale],
  )
  const save = async (event) => {
    event?.preventDefault()
    if (!dirty || state.pending || uploading) return
    if (
      model.slug !== saved.slug &&
      !(await confirm(
        'Thay đổi đường dẫn sẽ cập nhật liên kết từ phân hệ. Liên kết cũ sẽ không còn hoạt động. Tiếp tục?',
      ))
    )
      return
    setState({ pending: true })
    try {
      const result = await adminApi.saveSolutionDetail(
          page.id,
          model,
          csrfToken,
        ),
        draft = pageDraft(result)
      setPage(result)
      setModel(draft)
      setSaved(draft)
      setState({ success: 'Đã lưu thay đổi.' })
      dirtyRef.current = false
      if (result.slug !== slug)
        navigate(`/admin/solutions/${result.slug}`, { replace: true })
    } catch (error) {
      if (error.status === 401) clearAuth()
      setState({
        error:
          error.status === 400
            ? /required for publishing/.test(error.message)
              ? 'Để xuất bản, cần tiêu đề và nội dung tiếng Việt; trang phải được bật hiển thị.'
              : /slug/i.test(error.message)
                ? 'Đường dẫn không hợp lệ hoặc đã được sử dụng. Dùng chữ thường, số và dấu gạch ngang.'
                : 'Nội dung hoặc đường dẫn chưa hợp lệ. Kiểm tra các liên kết, ảnh và định dạng bài viết rồi thử lại.'
            : 'Không thể lưu. Nội dung đang nhập được giữ lại; vui lòng thử lại.',
      })
    }
  }
  saveRef.current = save
  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveRef.current?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  if (state.loading) return <p aria-busy="true">Đang tải trang chi tiết…</p>
  if (!model) return <p role="alert">{state.error}</p>
  const value = model.translations[locale],
    pending = !!state.pending
  const languageFields = (language) => {
    const hero = model.translations[language].hero
    return (
      <>
        {[
          ['eyebrow', 'Dòng giới thiệu'],
          ['title', 'Tiêu đề'],
          ['description', 'Mô tả'],
          ['alt', 'Mô tả ảnh bìa'],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <textarea
              rows={key === 'description' ? 3 : 2}
              value={hero[key]}
              onChange={(event) =>
                updateHero(language, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label>
          Nhãn nút
          <input
            value={hero.cta.label}
            onChange={(event) =>
              updateHero(language, {
                cta: { ...hero.cta, label: event.target.value },
              })
            }
          />
        </label>
      </>
    )
  }
  return (
    <section className="admin-solution-detail">
      <div className="admin-breadcrumb">
        <Link to="/admin/pages/solutions/modules">Phân hệ giải pháp</Link>
        <span>/</span>
        <span>Trang chi tiết</span>
      </div>
      <header className="admin-detail-heading">
        <h1>
          {model.translations.vi.hero.title || 'Trang chi tiết giải pháp'}
        </h1>
        <SemanticStatus dirty={saved.status !== 'PUBLISHED'}>
          {saved.status === 'PUBLISHED'
            ? 'Đã xuất bản'
            : saved.status === 'ARCHIVED'
              ? 'Đã lưu trữ'
              : 'Bản nháp'}
        </SemanticStatus>
      </header>
      <div className="admin-detail-actions">
        <div className="admin-language-buttons">
          {locales.map((language) => (
            <button
              type="button"
              className={`admin-language-button${locale === language ? ' is-active' : ''}`}
              key={language}
              disabled={uploading || pending}
              onClick={() => setLocale(language)}
            >
              {language === 'vi' ? 'Tiếng Việt' : 'English'}
            </button>
          ))}
        </div>
        <SemanticStatus dirty={!!dirty}>
          {dirty ? 'Chưa lưu' : 'Đã lưu'}
        </SemanticStatus>
        <button
          className="admin-button admin-button--ghost"
          type="button"
          disabled={!dirty || pending || uploading}
          onClick={async () => {
            if (await confirm('Bỏ thay đổi chưa lưu?')) {
              setModel(structuredClone(saved))
              setState({})
            }
          }}
        >
          Bỏ thay đổi
        </button>
        <button
          type="button"
          className="admin-button admin-button--primary"
          disabled={!dirty || pending || uploading}
          onClick={save}
        >
          {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
        <button
          className="admin-button admin-button--ghost"
          type="button"
          onClick={() => setPreview(true)}
        >
          Xem trang đã lưu
        </button>
        {saved.status === 'PUBLISHED' && (
          <a
            className="admin-header-preview"
            href={`${locale === 'en' ? '/en' : ''}/solutions/${saved.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Xem trên website <ExternalLink size={16} />
          </a>
        )}
      </div>
      {state.error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="admin-alert admin-alert--success" role="status">
          {state.success}
        </p>
      )}
      <fieldset disabled={pending} className="admin-editor-fields">
        <EditorTabs
          value={tab}
          onChange={setTab}
          label="Trang chi tiết giải pháp"
          tabs={[
            [
              'content',
              'Nội dung',
              <div className="admin-editor-section">
                <details className="admin-detail-hero">
                  <summary>Thông tin đầu trang</summary>
                  <BilingualPanel
                    vi={languageFields('vi')}
                    en={languageFields('en')}
                  />
                  <MediaField
                    onBusyChange={(busy) =>
                      setUploads((previous) => ({ ...previous, media: busy }))
                    }
                    label="Ảnh bìa"
                    value={value.hero.cover}
                    onChange={(cover) => sharedHero({ cover })}
                  />
                  <label>
                    Đường dẫn nút (dùng chung)
                    <input
                      value={value.hero.cta.url}
                      onChange={(event) =>
                        setModel((previous) => ({
                          ...previous,
                          translations: Object.fromEntries(
                            locales.map((language) => [
                              language,
                              {
                                ...previous.translations[language],
                                hero: {
                                  ...previous.translations[language].hero,
                                  cta: {
                                    ...previous.translations[language].hero.cta,
                                    url: event.target.value,
                                  },
                                },
                              },
                            ]),
                          ),
                        }))
                      }
                    />
                  </label>
                </details>
                <h2>
                  Nội dung bài viết ·{' '}
                  {locale === 'vi' ? 'Tiếng Việt' : 'English'}
                </h2>
                {locale === 'en' &&
                  !JSON.stringify(value.article.doc).includes('"text":') && (
                    <p className="admin-alert admin-alert--warning">
                      Chưa có nội dung tiếng Anh
                    </p>
                  )}
                <ArticleEditor
                  key={locale}
                  value={value.article}
                  onChange={updateArticle}
                  onBusyChange={articleBusy}
                  disabled={pending}
                />
                <section className="admin-editor-section">
                  <h3>Giải pháp liên quan</h3>
                  <div className="admin-module-checklist">
                    {modules
                      .filter((item) => item.slug !== model.slug)
                      .map((item) => (
                        <label className="admin-checkbox" key={item.key}>
                          <input
                            type="checkbox"
                            checked={model.related.moduleKeys.includes(
                              item.key,
                            )}
                            onChange={(event) =>
                              setModel({
                                ...model,
                                related: {
                                  moduleKeys: event.target.checked
                                    ? [...model.related.moduleKeys, item.key]
                                    : model.related.moduleKeys.filter(
                                        (key) => key !== item.key,
                                      ),
                                },
                              })
                            }
                          />
                          {item.title}
                        </label>
                      ))}
                  </div>
                </section>
              </div>,
            ],
            [
              'seo',
              'SEO',
              <div className="admin-editor-section">
                <BilingualPanel
                  vi={
                    <>
                      <label>
                        Tiêu đề trang
                        <input
                          value={model.translations.vi.title}
                          onChange={(event) =>
                            updateLocale('vi', { title: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Tiêu đề SEO
                        <input
                          value={model.translations.vi.seoTitle || ''}
                          onChange={(event) =>
                            updateLocale('vi', {
                              seoTitle: event.target.value || null,
                            })
                          }
                        />
                      </label>
                      <label>
                        Mô tả SEO
                        <textarea
                          value={model.translations.vi.seoDescription || ''}
                          onChange={(event) =>
                            updateLocale('vi', {
                              seoDescription: event.target.value || null,
                            })
                          }
                        />
                      </label>
                    </>
                  }
                  en={
                    <>
                      <label>
                        Page title
                        <input
                          value={model.translations.en.title}
                          onChange={(event) =>
                            updateLocale('en', { title: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        SEO title
                        <input
                          value={model.translations.en.seoTitle || ''}
                          onChange={(event) =>
                            updateLocale('en', {
                              seoTitle: event.target.value || null,
                            })
                          }
                        />
                      </label>
                      <label>
                        SEO description
                        <textarea
                          value={model.translations.en.seoDescription || ''}
                          onChange={(event) =>
                            updateLocale('en', {
                              seoDescription: event.target.value || null,
                            })
                          }
                        />
                      </label>
                    </>
                  }
                />
                <MediaField
                  onBusyChange={(busy) =>
                    setUploads((previous) => ({ ...previous, media: busy }))
                  }
                  label="Ảnh chia sẻ (dùng chung)"
                  value={value.hero.ogImage}
                  onChange={(ogImage) => sharedHero({ ogImage })}
                />
              </div>,
            ],
            [
              'settings',
              'Cài đặt',
              <div className="admin-editor-section">
                <label>
                  Đường dẫn
                  <input
                    value={model.slug}
                    onChange={(event) =>
                      setModel({ ...model, slug: event.target.value })
                    }
                  />
                  <small>
                    VI /solutions/{model.slug} · EN /en/solutions/{model.slug}
                  </small>
                </label>
                <label>
                  Trạng thái
                  <select
                    value={model.status}
                    onChange={(event) =>
                      setModel({ ...model, status: event.target.value })
                    }
                  >
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PUBLISHED">Đã xuất bản</option>
                    <option value="ARCHIVED">Đã lưu trữ</option>
                  </select>
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={model.visible}
                    onChange={(event) =>
                      setModel({ ...model, visible: event.target.checked })
                    }
                  />
                  Hiển thị trang
                </label>
                <p className="admin-muted">
                  Trang nháp và trang đã lưu trữ không hiển thị trên website.
                  Chọn “Đã xuất bản” rồi lưu để xuất bản.
                </p>
              </div>,
            ],
          ]}
        />
      </fieldset>
      <Dialog.Root open={preview} onOpenChange={setPreview}>
        <Dialog.Portal>
          <Dialog.Overlay className="admin-confirm-overlay" />
          <Dialog.Content className="admin-detail-preview">
            <Dialog.Title>Bản đã lưu · {locale.toUpperCase()}</Dialog.Title>
            <Dialog.Description>
              Nội dung đã lưu, bao gồm bản nháp. Thay đổi đang nhập chưa xuất
              hiện trong bản xem này.
            </Dialog.Description>
            <Dialog.Close
              className="admin-icon-button"
              aria-label="Đóng bản xem"
            >
              <X size={16} />
            </Dialog.Close>
            <h1>{saved.translations[locale].hero.title}</h1>
            <p>{saved.translations[locale].hero.description}</p>
            {saved.translations[locale].hero.cover && (
              <img
                src={saved.translations[locale].hero.cover}
                alt={saved.translations[locale].hero.alt}
              />
            )}
            <SolutionArticleView
              doc={saved.translations[locale].article.doc}
              language={locale}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
