import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useParams } from "react-router-dom";
import { CalendarDays, Clock3 } from "lucide-react";
import gsap from "gsap";
import { contentService } from "../../services/content/contentService";
import { getLanguageFromPathname, getLocalizedPath } from "../../i18n";
import SEO from "../../components/common/SEO/SEO";
import { NeotekNavbar } from "../../components/layout/NeotekNavbar/NeotekNavbar";
import { NeotekFooter } from "../../components/layout/NeotekFooter/NeotekFooter";
import { NeotekButton } from "../../components/common/NeotekButton/NeotekButton";
import NotFoundPage from "../not-found/NotFoundPage";
import {
  articleHeadings,
  articleText,
  SolutionArticleView,
  safeArticleUrl,
} from "./SolutionArticleView";
import "./SolutionDetailPage.css";

function relatedModules(page, listing, excluded = []) {
  const keys = [
    ...(page.related.moduleKeys || []),
    ...Object.keys(listing.solutionModules),
  ];
  const items = [...new Set(keys)]
    .map((key) => listing.solutionModules[key])
    .filter((item) => item && item.slug !== page.slug);
  // Prefer distinct recommendations; retain the bottom section for small inventories.
  return [
    ...items.filter((item) => !excluded.includes(item.slug)),
    ...items.filter((item) => excluded.includes(item.slug)),
  ].slice(0, 4);
}

const editorialDate = (date, english) =>
  new Intl.DateTimeFormat(english ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

const readingMinutes = (doc) =>
  Math.max(
    1,
    Math.ceil(articleText(doc).split(/\s+/).filter(Boolean).length / 225),
  );
const moduleIcon = (icon) =>
  /^[a-z0-9-]+\.svg$/i.test(icon) ? `/assets/SolutionPageIcon/${icon}` : null;

function ReadingRail({ headings, english, featured, language }) {
  const disclosure = useRef(null);
  const slot = useRef(null);
  const rail = useRef(null);
  const [desktop, setDesktop] = useState(false);
  const [activeId, setActiveId] = useState(headings[0]?.id);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1200px)");
    const resize = () => setDesktop(media.matches);
    resize();
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    if (disclosure.current) disclosure.current.open = desktop;
    const update = () => {
      const passed = headings.filter(
        (item) =>
          document.getElementById(item.id)?.getBoundingClientRect().top <= 150,
      );
      setActiveId(passed.at(-1)?.id || headings[0]?.id);
      if (desktop && slot.current && rail.current) {
        const bounds = slot.current.getBoundingClientRect();
        const bottom =
          slot.current.parentElement.getBoundingClientRect().bottom;
        const navbarHeight =
          document
            .querySelector(".neotek-navbar--scrolled.is-visible")
            ?.getBoundingClientRect().height || 72;
        const top = Math.min(
          Math.max(bounds.top, navbarHeight + 24),
          bottom - rail.current.offsetHeight - 24,
        );
        Object.assign(rail.current.style, {
          top: `${top}px`,
          left: `${bounds.left}px`,
          width: `${bounds.width}px`,
        });
      }
    };
    // A viewport portal avoids ScrollSmoother's transformed containing block.
    // Its existing ticker follows both smooth scrolling and image layout changes.
    gsap.ticker.add(update);
    update();
    return () => gsap.ticker.remove(update);
  }, [headings, desktop]);
  const navigation = (
    <nav
      ref={rail}
      className={`solution-detail-toc${desktop ? " is-reading-rail" : ""}`}
      aria-label={english ? "Article navigation" : "Điều hướng bài viết"}
    >
      <details ref={disclosure}>
        <summary>
          {english ? "Read & discover" : "Trong bài viết & nổi bật"}
        </summary>
        <div className="solution-detail-rail-stack">
          <section
            className="solution-detail-rail-panel solution-detail-rail-panel--toc"
            aria-labelledby="solution-detail-toc-title"
          >
            <h2 id="solution-detail-toc-title">
              {english ? "In this article" : "Trong bài viết"}
            </h2>
            <ol>
              {headings.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={activeId === item.id ? "location" : undefined}
                  >
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
            {!headings.length && (
              <p className="solution-detail-rail-empty">
                {english
                  ? "No sections in this article yet."
                  : "Bài viết chưa có mục lục."}
              </p>
            )}
          </section>

          <section
            className="solution-detail-rail-panel solution-detail-rail-panel--featured"
            aria-labelledby="solution-detail-featured-title"
          >
            <h2 id="solution-detail-featured-title">
              {english ? "Featured" : "Nổi bật"}
            </h2>
            <div className="solution-detail-discovery">
              {featured.map((item) => (
                <Link
                  key={item.slug}
                  to={getLocalizedPath("/solutions/" + item.slug, language)}
                  className="solution-detail-discovery-link"
                >
                  <RelatedThumbnail
                    src={safeArticleUrl(
                      item.detail.hero.cover || item.visualSrc,
                      true,
                    )}
                    icon={moduleIcon(item.icon)}
                  />
                  <div>
                    <strong>
                      {item.detail.hero.title || item.detail.title}
                    </strong>
                    {item.category && <small>{item.category}</small>}
                    <small>
                      <Clock3 size={12} aria-hidden="true" />
                      {readingMinutes(item.detail.article.doc)}{" "}
                      {english ? "min read" : "phút đọc"}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
            {!featured.length && (
              <p className="solution-detail-rail-empty">
                {english
                  ? "More published articles will appear here."
                  : "Các bài viết đã xuất bản khác sẽ xuất hiện tại đây."}
              </p>
            )}
          </section>
        </div>
      </details>
    </nav>
  );
  return (
    <div ref={slot} className="solution-detail-rail-slot">
      {desktop ? createPortal(navigation, document.body) : navigation}
    </div>
  );
}

function RelatedThumbnail({ src, icon }) {
  const [failedSource, setFailedSource] = useState(null);
  const image = failedSource === src ? icon : src || icon;
  const isIcon = !src || failedSource === src;
  return (
    <div
      className={`solution-detail-related-thumbnail${isIcon ? " is-module-icon" : ""}`}
    >
      {image && (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => {
            if (image !== icon) setFailedSource(src);
            else event.currentTarget.hidden = true;
          }}
        />
      )}
    </div>
  );
}

function articleParts(doc) {
  const final = [];
  const visit = (node) => {
    if (node.type === "articleCta" && node.attrs?.placement === "final") {
      final.push(node);
      return [];
    }
    return [
      {
        ...node,
        ...(node.content ? { content: node.content.flatMap(visit) } : {}),
      },
    ];
  };
  return {
    article: { ...doc, content: doc.content.flatMap(visit) },
    final: { type: "doc", content: final },
  };
}

export default function SolutionDetailPage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const language = getLanguageFromPathname(pathname);
  const english = language === "en";
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    Promise.all([
      contentService.getSolutionDetail(slug, language),
      contentService
        .getSolutionsPage(language)
        .catch(() => ({ solutionModules: {}, detailAvailability: [] })),
    ])
      .then(async ([page, listing]) => {
        // Availability is published-only and locale-aware; do not invent featured records.
        const candidates = listing.detailAvailability
          .filter(
            (item) =>
              item.slug !== page.slug && item.locales.includes(language),
          )
          .slice(0, 3);
        const featured = (
          await Promise.all(
            candidates.map(async (candidate) => {
              const item = Object.values(listing.solutionModules).find(
                (item) => item.slug === candidate.slug,
              ) || { slug: candidate.slug };
              const detail = await contentService
                .getSolutionDetail(candidate.slug, language)
                .catch(() => null);
              const group = listing.solutionGroups?.find((group) =>
                group.modules.includes(item.key),
              );
              return detail
                ? {
                    ...item,
                    detail,
                    category: group?.eyebrow || group?.title || "",
                  }
                : null;
            }),
          )
        ).filter(Boolean);
        const related = await Promise.all(
          relatedModules(
            page,
            listing,
            featured.map((item) => item.slug),
          ).map(async (item) => {
            const detail = item.detailAvailable
              ? await contentService
                  .getSolutionDetail(item.slug, language)
                  .catch(() => null)
              : null;
            const group = listing.solutionGroups?.find((group) =>
              group.modules.includes(item.key),
            );
            return {
              ...item,
              detail,
              category: group?.eyebrow || group?.title || "",
            };
          }),
        );
        if (active) setState({ page, listing, related, featured });
      })
      .catch((error) => {
        if (active) setState({ error });
      });
    return () => {
      active = false;
    };
  }, [slug, language]);
  if (state.loading)
    return (
      <main className="solution-detail-page" aria-busy="true">
        <p className="solution-detail-loading">
          {english ? "Loading article…" : "Đang tải bài viết…"}
        </p>
      </main>
    );
  if (state.error)
    return state.error.status === 404 || /\(404\)/.test(state.error.message) ? (
      <NotFoundPage />
    ) : (
      <main className="solution-detail-page">
        <SEO robots="noindex, follow" />
        <p role="alert">
          {english
            ? "Unable to load this article. Please try again."
            : "Không thể tải bài viết. Vui lòng thử lại."}
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          {english ? "Retry" : "Thử lại"}
        </button>
      </main>
    );
  const { page, listing, related, featured } = state;
  const hero = page.hero;
  const doc = page.article.doc;
  const parts = articleParts(doc);
  const headings = articleHeadings(doc);
  const minutes = readingMinutes(doc);
  const solution = Object.values(listing.solutionModules).find(
    (item) => item.slug === slug,
  );
  const group = listing.solutionGroups?.find((item) =>
    item.modules.includes(solution?.key),
  );
  const identityIcon = moduleIcon(solution?.icon);
  return (
    <div className="solution-detail-page">
      <SEO
        title={page.seo.title || `${hero.title || page.title} | Neotek`}
        description={page.seo.description || hero.description}
        image={hero.ogImage || hero.cover || undefined}
        type="article"
        localized={listing.detailAvailability.some(
          (item) =>
            item.slug === slug &&
            item.locales.includes("vi") &&
            item.locales.includes("en"),
        )}
      />
      <NeotekNavbar />
      <main className="solution-detail-content">
        <div className="solution-detail-reading-layout has-rail">
          <div className="solution-detail-main-article">
            <header className="solution-detail-header">
              <Link
                className="solution-detail-breadcrumb"
                to={getLocalizedPath("/solutions", language)}
              >
                {english ? "Solutions" : "Giải pháp"}
              </Link>
              {hero.eyebrow && <p className="neotek-eyebrow">{hero.eyebrow}</p>}
              <h1>{hero.title || page.title}</h1>
              <p className="solution-detail-description">{hero.description}</p>
              <p className="solution-detail-meta">
                <span className="solution-detail-identity">
                  {identityIcon && (
                    <img src={identityIcon} alt="" width="20" height="20" />
                  )}
                  {group?.eyebrow || group?.title || "NeoERP Solution"}
                </span>
                {group && (
                  <span className="solution-detail-product-label">
                    NeoERP Solution
                  </span>
                )}
                {(page.updatedAt || page.publishedAt) && (
                  <span>
                    <CalendarDays size={14} aria-hidden="true" />
                    <time
                      aria-label={`${english ? "Updated" : "Cập nhật"}: ${editorialDate(page.updatedAt || page.publishedAt, english)}`}
                      dateTime={page.updatedAt || page.publishedAt}
                    >
                      {editorialDate(
                        page.updatedAt || page.publishedAt,
                        english,
                      )}
                    </time>
                  </span>
                )}
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {minutes} {english ? "min read" : "phút đọc"}
                </span>
              </p>
              {hero.cta?.label && safeArticleUrl(hero.cta.url) && (
                <NeotekButton
                  href={
                    hero.cta.url.startsWith("/")
                      ? getLocalizedPath(hero.cta.url, language)
                      : hero.cta.url
                  }
                >
                  {hero.cta.label}
                </NeotekButton>
              )}
            </header>
            {safeArticleUrl(hero.cover, true) && (
              <figure className="solution-detail-cover">
                <img
                  src={hero.cover}
                  alt={hero.alt || ""}
                  loading="eager"
                  decoding="async"
                />
              </figure>
            )}
            <SolutionArticleView doc={parts.article} language={language} />
          </div>
          <ReadingRail
            headings={headings}
            english={english}
            featured={featured}
            language={language}
          />
        </div>
        {related.length > 0 && (
          <section className="solution-detail-related">
            <h2>{english ? "Related content" : "Bài viết liên quan"}</h2>
            <div>
              {related.map((item, index) => {
                const image = safeArticleUrl(
                  item.detail?.hero.cover || item.visualSrc,
                  true,
                );
                const icon = moduleIcon(item.icon);
                const date = item.detail?.publishedAt || item.detail?.updatedAt;
                const readTime = item.detail?.article?.doc
                  ? readingMinutes(item.detail.article.doc)
                  : null;
                return (
                  <Link
                    className={`solution-detail-related-card${index === 0 ? " is-featured" : ""}`}
                    key={item.key || item.title}
                    to={getLocalizedPath(
                      item.detail ? `/solutions/${item.slug}` : "/solutions",
                      language,
                    )}
                  >
                    <RelatedThumbnail src={image} icon={icon} />
                    <div className="solution-detail-related-copy">
                      {item.category && (
                        <span className="solution-detail-related-category">
                          {item.category}
                        </span>
                      )}
                      <h3>{item.detail?.hero.title || item.title}</h3>
                      {index === 0 && item.description && (
                        <p>
                          {item.detail?.hero.description || item.description}
                        </p>
                      )}
                      {(date || readTime) && (
                        <div className="solution-detail-meta">
                          {date && (
                            <span>
                              <CalendarDays size={14} aria-hidden="true" />
                              <time dateTime={date}>
                                {editorialDate(date, english)}
                              </time>
                            </span>
                          )}
                          {readTime && (
                            <span>
                              <Clock3 size={14} aria-hidden="true" />
                              {readTime} {english ? "min read" : "phút đọc"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {parts.final.content.length > 0 && (
          <section className="solution-detail-final-cta">
            <SolutionArticleView doc={parts.final} language={language} />
          </section>
        )}
      </main>
      <NeotekFooter />
    </div>
  );
}
