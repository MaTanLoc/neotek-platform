import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Dialog, Tabs, DropdownMenu } from "radix-ui";
import { ExternalLink, X } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { useCms } from "../../app/cmsContext";
import { useConfirm } from "../../app/ConfirmProvider";
import { adminApi } from "../../../services/admin/adminApi";
import { SemanticStatus } from "../shared/EditorPrimitives";
import { MediaField } from "../shared/MediaField";
import { ArticleEditor } from "./ArticleEditor";
import { SolutionArticleView } from "../../../pages/solutions/SolutionArticleView";
import "../../../pages/solutions/SolutionDetailPage.css";
import "../../styles/admin-solution-detail.css";

const locales = ["vi", "en"];
function pageDraft(page) {
  const content = (key, locale) =>
    page.sections
      .find((section) => section.key === key)
      ?.translations.find((item) => item.locale === locale)?.content;
  return {
    slug: page.slug,
    status: page.status,
    visible: page.sections
      .filter((section) => ["hero", "article"].includes(section.key))
      .every((section) => section.enabled),
    publishedAt: page.publishedAt || null,
    related: content("related", "vi") || { moduleKeys: [] },
    translations: Object.fromEntries(
      locales.map((locale) => {
        const translation = page.translations.find(
          (item) => item.locale === locale,
        );
        return [
          locale,
          {
            title: translation?.title || "",
            seoTitle: translation?.seoTitle || null,
            seoDescription: translation?.seoDescription || null,
            hero: content("hero", locale),
            article: content("article", locale),
          },
        ];
      }),
    ),
  };
}
function mirrorSharedNodes(previous, next, other) {
  const old = new Map(),
    patches = new Map();
  const visit = (node, callback) => {
    callback(node);
    node.content?.forEach((child) => visit(child, callback));
  };
  visit(previous.doc, (node) => {
    if (node.attrs?.id) old.set(node.attrs.id, node.attrs);
  });
  visit(next.doc, (node) => {
    if (!old.has(node.attrs?.id)) return;
    const attrs = old.get(node.attrs.id);
    const keys =
      node.type === "articleImage"
        ? ["src", "display"]
        : node.type === "articleCta"
          ? ["url", "style", "placement"]
          : [];
    const patch = Object.fromEntries(
      keys
        .filter((key) => attrs[key] !== node.attrs[key])
        .map((key) => [key, node.attrs[key]]),
    );
    if (Object.keys(patch).length) patches.set(node.attrs.id, patch);
  });
  if (!patches.size) return other;
  const clone = structuredClone(other);
  visit(clone.doc, (node) => {
    if (patches.has(node.attrs?.id))
      Object.assign(node.attrs, patches.get(node.attrs.id));
  });
  return clone;
}
export default function SolutionDetailEditor() {
  const { slug } = useParams(),
    navigate = useNavigate(),
    { csrfToken, clearAuth } = useAuth(),
    { dirty: dirtyRef } = useCms(),
    confirm = useConfirm();
  const [page, setPage] = useState(null),
    [model, setModel] = useState(null),
    [saved, setSaved] = useState(null),
    [modules, setModules] = useState([]),
    [locale, setLocale] = useState("vi"),
    [state, setState] = useState({ loading: true }),
    [preview, setPreview] = useState(false);
  const workspaceRef = useRef(null);
  const [inspectorDesktop, setInspectorDesktop] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  useEffect(() => {
    if (!workspaceRef.current) return;
    const observer = new ResizeObserver((entries) =>
      setInspectorDesktop(entries[0].contentRect.width >= 960),
    );
    observer.observe(workspaceRef.current);
    return () => observer.disconnect();
  }, [page]);
  const saveRef = useRef(null);
  const [uploads, setUploads] = useState({});
  const uploading = Object.values(uploads).some(Boolean);
  const articleBusy = useCallback(
    (busy) => setUploads((previous) => ({ ...previous, article: busy })),
    [],
  );
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    Promise.all([
      adminApi.getSolutionDetail(slug),
      adminApi.getPage("solutions"),
    ])
      .then(([detail, listing]) => {
        if (!active) return;
        const draft = pageDraft(detail);
        setPage(detail);
        setModel(draft);
        setSaved(draft);
        setModules(
          listing.sections
            .find((section) => section.type === "solutionModules")
            ?.translations.find((item) => item.locale === "vi")?.content
            .items || [],
        );
        setState({});
      })
      .catch((error) => {
        if (active) {
          if (error.status === 401) clearAuth();
          setState({
            error:
              error.status === 404
                ? "Không tìm thấy trang chi tiết."
                : "Không thể tải trang chi tiết. Vui lòng thử lại.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [slug, clearAuth]);
  const dirty = model && JSON.stringify(model) !== JSON.stringify(saved);
  useEffect(() => {
    dirtyRef.current = !!dirty || uploading;
    return () => {
      dirtyRef.current = false;
    };
  }, [dirty, uploading, dirtyRef]);
  const updateLocale = (language, patch) =>
    setModel((previous) => ({
      ...previous,
      translations: {
        ...previous.translations,
        [language]: { ...previous.translations[language], ...patch },
      },
    }));
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
    }));
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
    }));
  const updateArticle = useCallback(
    (article) =>
      setModel((previous) => {
        const other = locale === "vi" ? "en" : "vi";
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
        };
      }),
    [locale],
  );
  const save = async (event) => {
    event?.preventDefault();
    if (!dirty || state.pending || uploading) return;
    if (
      model.slug !== saved.slug &&
      !(await confirm(
        "Thay đổi đường dẫn sẽ cập nhật liên kết từ phân hệ. Liên kết cũ sẽ không còn hoạt động. Tiếp tục?",
      ))
    )
      return;
    setState({ pending: true });
    try {
      const result = await adminApi.saveSolutionDetail(
          page.id,
          model,
          csrfToken,
        ),
        draft = pageDraft(result);
      setPage(result);
      setModel(draft);
      setSaved(draft);
      setState({ success: "Đã lưu thay đổi." });
      dirtyRef.current = false;
      if (result.slug !== slug)
        navigate(`/admin/solutions/${result.slug}`, { replace: true });
    } catch (error) {
      if (error.status === 401) clearAuth();
      setState({
        error:
          error.status === 400
            ? /required for publishing/.test(error.message)
              ? "Để xuất bản, cần tiêu đề và nội dung tiếng Việt; trang phải được bật hiển thị."
              : /slug/i.test(error.message)
                ? "Đường dẫn không hợp lệ hoặc đã được sử dụng. Dùng chữ thường, số và dấu gạch ngang."
                : "Nội dung hoặc đường dẫn chưa hợp lệ. Kiểm tra các liên kết, ảnh và định dạng bài viết rồi thử lại."
            : "Không thể lưu. Nội dung đang nhập được giữ lại; vui lòng thử lại.",
      });
    }
  };
  saveRef.current = save;
  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  if (state.loading) return <p aria-busy="true">Đang tải trang chi tiết…</p>;
  if (!model) return <p role="alert">{state.error}</p>;
  const value = model.translations[locale],
    pending = !!state.pending;
  const languageName = locale === "vi" ? "Tiếng Việt" : "English";
  return (
    <section ref={workspaceRef} className="admin-solution-detail">
      <div className="admin-breadcrumb">
        <Link to="/admin/solution-details">Chi tiết giải pháp</Link>
        <span>/</span>
        <span>{languageName}</span>
      </div>
      <header className="admin-detail-heading">
        <div className="admin-detail-heading-copy">
          <span className="admin-detail-heading-kicker">Bài viết chi tiết</span>
          <h1>
            {value.hero.title || value.title || "Trang chi tiết giải pháp"}
          </h1>
        </div>
        <SemanticStatus dirty={saved.status !== "PUBLISHED"}>
          {saved.status === "PUBLISHED"
            ? "Đã xuất bản"
            : saved.status === "ARCHIVED"
              ? "Đã lưu trữ"
              : "Bản nháp"}
        </SemanticStatus>
      </header>
      <Tabs.Root
        value={locale}
        onValueChange={setLocale}
        className="admin-detail-locale-tabs"
      >
        <div className="admin-detail-actions">
          <div className="admin-detail-language-switcher">
            <span className="admin-detail-actions-label">Ngôn ngữ</span>
            <Tabs.List
              className="admin-editor-tab-rail admin-detail-language-tabs"
              aria-label="Ngôn ngữ bài viết"
            >
              {locales.map((language) => (
                <Tabs.Trigger
                  key={language}
                  value={language}
                  disabled={uploading || pending}
                >
                  {language === "vi" ? "Tiếng Việt" : "English"}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
          <div className="admin-detail-save-actions">
            <SemanticStatus dirty={!!dirty} pending={pending}>
              {pending ? "Đang lưu…" : dirty ? "Chưa lưu" : "Đã lưu"}
            </SemanticStatus>
            <button
              className="admin-button admin-button--ghost"
              type="button"
              disabled={!dirty || pending || uploading}
              onClick={async () => {
                if (await confirm("Bỏ thay đổi chưa lưu?")) {
                  setModel(structuredClone(saved));
                  setState({});
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
              {pending ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
            {saved.status === "PUBLISHED" && saved.visible && (
              <a
                className="admin-header-preview"
                href={
                  (locale === "en" ? "/en" : "") + "/solutions/" + saved.slug
                }
                target="_blank"
                rel="noreferrer"
              >
                Xem trên website <ExternalLink size={16} />
              </a>
            )}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                className="admin-icon-button"
                aria-label="Tùy chọn bản xem"
                title="Tùy chọn bản xem"
              >
                •••
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="admin-select-content"
                  sideOffset={8}
                >
                  <DropdownMenu.Item
                    className="admin-select-item"
                    onSelect={() => setPreview(true)}
                  >
                    Xem trang đã lưu
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
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
        {locales.map((language) => (
          <Tabs.Content
            value={language}
            key={language}
            className="admin-detail-locale-panel"
          >
            {locale === language && (
              <fieldset
                disabled={pending}
                className="admin-editor-fields admin-detail-workspace"
              >
                <div className="admin-detail-document">
                  <section
                    className="admin-detail-intro"
                    aria-label={"Thông tin bài viết · " + languageName}
                  >
                    <label>
                      Dòng giới thiệu
                      <input
                        value={value.hero.eyebrow}
                        onChange={(event) =>
                          updateHero(locale, { eyebrow: event.target.value })
                        }
                      />
                    </label>
                    <label className="admin-detail-title-field">
                      Tiêu đề
                      <textarea
                        rows={2}
                        value={value.hero.title || value.title}
                        onChange={(event) => {
                          updateHero(locale, { title: event.target.value });
                          updateLocale(locale, { title: event.target.value });
                        }}
                      />
                    </label>
                    <label>
                      Mô tả
                      <textarea
                        rows={3}
                        value={value.hero.description}
                        onChange={(event) =>
                          updateHero(locale, {
                            description: event.target.value,
                          })
                        }
                      />
                    </label>
                    <MediaField
                      label="Ảnh bìa (dùng chung)"
                      value={value.hero.cover}
                      onChange={(cover) => sharedHero({ cover })}
                      onBusyChange={(busy) =>
                        setUploads((previous) => ({ ...previous, media: busy }))
                      }
                    />
                    <label>
                      Mô tả ảnh bìa
                      <input
                        value={value.hero.alt}
                        onChange={(event) =>
                          updateHero(locale, { alt: event.target.value })
                        }
                      />
                    </label>
                    <details className="admin-detail-optional-cta">
                      <summary>Nút đầu bài (tùy chọn)</summary>
                      <label>
                        Nhãn nút
                        <input
                          value={value.hero.cta.label}
                          onChange={(event) =>
                            updateHero(locale, {
                              cta: {
                                ...value.hero.cta,
                                label: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
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
                                        ...previous.translations[language].hero
                                          .cta,
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
                  </section>
                  {locale === "en" &&
                    !JSON.stringify(value.article.doc).includes('"text":') && (
                      <p className="admin-alert admin-alert--warning">
                        Chưa có nội dung tiếng Anh
                      </p>
                    )}
                  <ArticleEditor
                    key={locale}
                    locale={locale}
                    value={value.article}
                    onChange={updateArticle}
                    onBusyChange={articleBusy}
                    disabled={pending}
                  />
                </div>
                <details
                  className="admin-detail-inspector"
                  open={inspectorDesktop || inspectorOpen}
                  onToggle={(event) => {
                    if (!inspectorDesktop)
                      setInspectorOpen(event.currentTarget.open);
                  }}
                >
                  <summary>Thông tin & cài đặt bài viết</summary>
                  <div className="admin-detail-inspector-body">
                    <details className="admin-detail-inspector-section" open>
                      <summary>Xuất bản</summary>
                      <section className="admin-detail-publishing admin-editor-section">
                        <label>
                          Trạng thái
                          <select
                            value={model.status}
                            onChange={(event) =>
                              setModel((previous) => ({
                                ...previous,
                                status: event.target.value,
                              }))
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
                              setModel((previous) => ({
                                ...previous,
                                visible: event.target.checked,
                              }))
                            }
                          />
                          Hiển thị trang
                        </label>
                        <label>
                          Đường dẫn chuẩn
                          <input
                            value={model.slug}
                            onChange={(event) =>
                              setModel((previous) => ({
                                ...previous,
                                slug: event.target.value,
                              }))
                            }
                          />
                          <small>
                            VI /solutions/{model.slug}
                            <br />
                            EN /en/solutions/{model.slug}
                          </small>
                        </label>
                        <p className="admin-muted">
                          Bản nháp và trang đã lưu trữ không hiển thị trên
                          website. Chọn “Đã xuất bản” rồi lưu để xuất bản.
                        </p>
                      </section>
                    </details>

                    <details className="admin-detail-inspector-section" open>
                      <summary>SEO · {languageName}</summary>
                      <section className="admin-detail-seo admin-editor-section">
                        <label>
                          Tiêu đề SEO
                          <input
                            value={value.seoTitle || ""}
                            placeholder={value.hero.title || value.title}
                            maxLength={200}
                            onChange={(event) =>
                              updateLocale(locale, {
                                seoTitle: event.target.value || null,
                              })
                            }
                          />
                          {!value.seoTitle && (
                            <small>Dùng tiêu đề bài viết</small>
                          )}
                        </label>
                        <label>
                          Mô tả SEO
                          <textarea
                            rows={3}
                            value={value.seoDescription || ""}
                            placeholder={value.hero.description}
                            maxLength={500}
                            onChange={(event) =>
                              updateLocale(locale, {
                                seoDescription: event.target.value || null,
                              })
                            }
                          />
                          {!value.seoDescription && (
                            <small>Dùng mô tả bài viết</small>
                          )}
                        </label>
                        <div className="admin-detail-seo-preview">
                          <strong>
                            {value.seoTitle ||
                              (value.hero.title || value.title) + " | Neotek"}
                          </strong>
                          <p>
                            {value.seoDescription || value.hero.description}
                          </p>
                        </div>
                        <MediaField
                          label="Ảnh chia sẻ (dùng chung)"
                          value={value.hero.ogImage}
                          onChange={(ogImage) => sharedHero({ ogImage })}
                          onBusyChange={(busy) =>
                            setUploads((previous) => ({
                              ...previous,
                              og: busy,
                            }))
                          }
                        />
                      </section>
                    </details>

                    <details className="admin-detail-inspector-section" open>
                      <summary>Bài viết liên quan</summary>
                      <section className="admin-editor-section">
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
                                    setModel((previous) => ({
                                      ...previous,
                                      related: {
                                        moduleKeys: event.target.checked
                                          ? [
                                              ...previous.related.moduleKeys,
                                              item.key,
                                            ]
                                          : previous.related.moduleKeys.filter(
                                              (key) => key !== item.key,
                                            ),
                                      },
                                    }))
                                  }
                                />
                                {item.title}
                              </label>
                            ))}
                        </div>
                      </section>
                    </details>
                  </div>
                </details>
              </fieldset>
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>
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
  );
}
