# Solution Detail CMS implementation report

Implemented 2026-10-08. This is a database-backed vertical slice, using the existing NestJS pages/admin domains and React content adapter. No commit or push was made. Unrelated uncommitted work was preserved.

## 1. Data model

Reused `Page`, `PageTranslation`, `PageSection`, and `PageSectionTranslation`. Each detail page has one language-neutral slug, two page translations, and three sections: `hero / solutionDetailHero`, `article / solutionArticle`, and `related / relatedSolutions`. Module listing records retain only their listing content and slug reference; article documents are never stored in `solutionModules.items[]`.

## 2. Prisma change

Added `PageKind` with `STANDARD` and `SOLUTION_DETAIL`, `Page.kind` defaulting to `STANDARD`, and an index on kind/status. Existing publication timestamps and translation SEO fields are reused. No parallel CMS models were added.

## 3. Migration

Created and applied only `20261008000000_solution_detail_kind` to the local database. Prisma Client was regenerated. Existing migrations were checked before deployment; no unrelated migration was applied. Deployment to another environment requires its normal migration deployment procedure.

## 4. Backend APIs

All paths below use the existing `/api` prefix.

| Method and path | Behavior |
| --- | --- |
| `GET /api/admin/solutions` | Detail availability/status for authenticated managers, including drafts. |
| `GET /api/admin/solutions/:slug` | Full saved bilingual detail using the existing admin page reader. |
| `POST /api/admin/solutions` | `{ moduleKey }`; validates persisted matching VI/EN module slugs and creates one draft with both translations and all three sections atomically. |
| `PUT /api/admin/solutions/:id` | Atomic page, publication state, VI/EN metadata, hero, article, and related-module save. |
| `GET /api/pages/solution-details` | Published locale availability for public module links and hreflang. |
| `GET /api/pages/:slug?locale=vi` or `locale=en` | Existing public page delivery, with detail-specific publication/readability checks. |

Publishing uses the atomic detail PUT; there is no redundant status-only CRUD stack. New admin operations reuse the existing session, role, origin, and CSRF guards. Existing auth/session implementation was not changed by this work.

## 5. Tiptap dependencies

Added five direct packages at compatible version `3.31.4`: `@tiptap/core`, `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, and `@tiptap/extension-bubble-menu`. Installed React remains 18.3.1. StarterKit supplies the standard document nodes, marks, lists, links, and history. The detail editor is loaded through the lazy admin route, rather than eagerly bundling Tiptap into public article rendering.

## 6. Editor capabilities

The document canvas supports typing, Enter paragraphs, H2/H3, bold, italic, safe links, bullet/numbered lists, blockquotes, horizontal rules, images, CTA, semantic callout, undo/redo, and focused block move up/down, duplicate, and delete. Article H1, raw HTML/JSON, arbitrary fonts/colors/styles, and developer data controls are excluded. Hero owns the public H1.

Text selection shows Tiptap BubbleMenu; it is not a permanent toolbar. Block tools appear while the document is focused. Duplicate/paste operations assign new stable heading/media/CTA identifiers. Transactions do not force a whole Tiptap React rerender; the article component is memoized.

## 7. Slash command

Typing `/` in an otherwise empty paragraph opens a Radix Popover near the caret. Lucide icons match the existing admin library. ArrowUp/ArrowDown cycle commands, Enter applies the selection, and Escape dismisses. Commands include paragraph, H2/H3, image, both list types, quote, callout, CTA, and rule. No page-builder palette was added.

## 8. Images and Cloudinary

Slash insertion, image file drop, clipboard image paste, and selected-image replacement reuse `uploadCmsImage` and the existing signed Cloudinary endpoint. The existing 10 MB policy and PNG/JPEG/WebP/GIF/AVIF formats are retained. Only `secure_url` is persisted. Selected images expose replace/remove, localized alt/caption, and controlled `normal`, `wide`, or `full` display. Full sources are preserved without a new cropping system.

Pending/success/error indicators use semantic tokens. Uploads are aborted when the article editor unmounts; save, discard, and language switching are disabled while an upload is pending. Existing portrait editing and other media fields remain in their existing architecture.

Live Cloudinary network upload was not performed. Browser checks simulate signing and upload responses through the existing flow; existing backend media tests remain part of the full passing suite.

## 9. Bilingual behavior

Local Tiếng Việt/English tabs select one writing canvas. Hero and SEO metadata remain paired VI/EN fields. Article text trees are independent and are not paired by array index or automatically translated. Empty English shows “Chưa có nội dung tiếng Anh”.

Slug, status, visibility, related module keys, hero cover/OG image, and hero CTA destination are shared. Article image/CTA references that use the same stable ID synchronize image source/display or CTA destination/style/placement while retaining localized alt/caption/copy. References present in only one document are valid. Backend validation rejects conflicting shared references. Both languages and publication state save in one serializable transaction.

## 10. Hero model

Localized eyebrow, title, description, cover alt, and CTA label; shared cover, CTA URL, and OG image. The admin hero is a compact disclosure. The public hero is an editorial header with title, description, update date, calculated reading time, optional CTA, and wide cover. The existing Solutions landing hero was not reused or redesigned.

## 11. Article storage

Canonical section JSON is `{ version: 1, doc: { type: 'doc', content: [...] } }`. Custom node names are `articleImage`, `articleCta`, and `callout`. Safe React rendering reads this JSON directly; no arbitrary HTML blob or `dangerouslySetInnerHTML` renderer is used.

A solution-specific CTA is stored once as an article node. Its controlled `placement` selects inline display or a final page CTA after related solutions. This does not copy the canonical Home/Solutions shared CTA. Existing shared-content sources/resolver and the separate footer content remain unchanged.

## 12. Saving and publishing

Explicit Save and Ctrl/Cmd+S persist the complete bilingual page. No autosave. Save failures keep the draft. Existing CMS navigation/beforeunload guards protect unsaved content. Slug changes require the existing Radix confirmation; they atomically update matching module slug references without rewriting module keys. Old detail URLs then return not found; no automatic redirects are created.

Publishing requires visible Vietnamese content with page title, hero title, and readable article text. Draft/archived/hidden pages are public 404s. An empty English locale remains public 404 even when Vietnamese is published. Status changes are saved explicitly. `publishedAt` is set/reused on publish and cleared on draft/archive. Saved preview supports drafts using the public article renderer; it excludes unsaved edits.

## 13. SEO

Reused `PageTranslation.seoTitle` and `seoDescription`, the existing SEO component, and shared hero OG image. Title/description fall back to the saved localized hero. Detail pages set article Open Graph type and route-based canonical. VI/EN/x-default alternates are emitted only when both locale details are actually available. Existing standard-page SEO behavior is preserved.

Metadata remains client-rendered within the existing SPA. SSR/prerendering was not introduced; deployments should retain the current SPA route fallback. API draft/unknown-slug responses are actual HTTP 404s; browser routes show the existing localized not-found page.

## 14. Routes

- Manager: `/admin/solutions/:slug`
- Public VI: `/solutions/:slug`
- Public EN: `/en/solutions/:slug`

Detail-kind records in the admin Pages list open the dedicated manager. Article editing is not embedded in the Solutions module collection form.

## 15. TOC and reading time

TOC is generated from H2 nodes, including headings nested in blockquotes/callouts. Persisted identifiers remain stable through copy edits and reordering. Fallback identifiers avoid collisions with existing IDs. TOC anchors target the rendered H2 elements with fixed-header scroll clearance. The disclosure can be collapsed on mobile. Reading time is calculated from document text at 225 words per minute, rounded up to at least one minute.

## 16. Related solutions and final CTA

An admin checklist stores existing module keys, duplicated neither as article text nor marketing copy. Backend rejects unknown keys. Public rendering resolves current localized module titles/descriptions. Published module details receive their detail link; others link to the verified Solutions overview. A page-specific CTA can be placed after this area using its node's final placement option.

## 17. Module integration

The existing module content editor now contains a compact `ModuleDetailPanel` with status and Create/Edit action. Creating requires the listing slug to have been saved; dirty module drafts are not silently discarded. Create inherits only existing localized module titles and initializes safe empty article/hero fields. Duplicate slugs are rejected.

The public module accordion obtains published locale availability through the existing backend adapter. Only available detail slugs become clickable detail CTAs. No guessed hardcoded detail registry remains. Article data is never appended to module records.

## 18. Demo data

Created and published one explicitly labeled demonstration page at `nhan-su-tien-luong` in VI/EN, linked to the existing `hrPayroll` module. The structural key `hrPayroll` was preserved. The script assigned the shared slug to that existing module in both locales.

The concise demo has a hero, four H2 sections, paragraphs based on existing module content, a feature list, two existing project images, one info callout, one booking CTA, and related modules. It labels its content as demonstration material requiring marketing review; it is not presented as approved new product claims. Cover/media reuse the existing Solutions Cloudinary visual and `/assets/bg-cta-auth.png`. The seeded CTA remains inline; managers can select final placement without duplicating its content.

## 19. Seed script

From `Neotek Backend`:

```powershell
npm.cmd run content:solution-detail-demo -- --dry-run
npm.cmd run content:solution-detail-demo -- --apply
```

The script accepts exactly one mode, checks the existing bilingual module, rejects another assigned slug, and uses one serializable transaction. Existing detail content is always preserved; there is no force overwrite mode. It invalidates only the affected Solutions/detail page locale keys when applying changes. Initial dry-run/apply completed; post-apply dry-run reports `changes: []` and `existingContentPreserved: true`. Running it again does not rewrite edited articles. The separate shared-content migration script was not applied by this task.

## 20. Files created in this vertical slice

Frontend:

- `src/admin/editors/solution-detail/ArticleEditor.jsx`
- `src/admin/editors/solution-detail/ArticleNodes.jsx`
- `src/admin/editors/solution-detail/SolutionDetailEditor.jsx`
- `src/admin/editors/solutions/ModuleDetailPanel.jsx`
- `src/admin/styles/admin-solution-detail.css`
- `src/pages/solutions/SolutionArticleView.jsx`
- `src/pages/solutions/SolutionDetailPage.jsx`
- `src/pages/solutions/SolutionDetailPage.css`
- `docs/SOLUTION_DETAIL_CMS_REPORT.md`
- `docs/solution-detail-public-vi-1440.png`
- `docs/solution-detail-public-en-1440.png`
- `docs/solution-detail-admin-820.png`

Backend:

- `prisma/migrations/20261008000000_solution_detail_kind/migration.sql`
- `src/pages/solution-detail.ts`
- `src/pages/solution-detail.spec.ts`
- `src/admin/solution-detail.spec.ts`
- `src/sections/validation/solution-detail.schemas.ts`
- `src/sections/validation/solution-detail.schemas.spec.ts`
- `scripts/solution-detail-demo.ts`
- `scripts/check-solution-detail.cjs`

Node views and extension factories remain together; small render/TOC helpers remain beside their renderer. No trivial wrapper/component forest was added.

## 21. Files modified in this vertical slice

Frontend:

- `package.json`, `package-lock.json`
- `src/App.jsx`
- `src/admin/app/AdminApp.jsx`
- `src/admin/pages/PagesList.jsx`
- `src/admin/editors/shared-sections/CollectionSectionEditor.jsx`
- `src/components/common/SEO/SEO.jsx`
- `src/pages/solutions/SolutionsPage.jsx`
- `src/pages/solutions/solutionPresentation.js`
- `src/services/admin/adminApi.js`
- `src/services/content/contentService.js`
- `src/services/content/adapters/backendApiAdapter.js`
- `scripts/check-cms-migration.mjs`
- `scripts/check-cms-routes.mjs`
- `docs/ADMIN_CMS_GUIDE.md`

Backend:

- `package.json`
- `prisma/schema.prisma`
- `src/admin/admin.controller.ts`
- `src/admin/admin.service.ts`
- `src/pages/pages.controller.ts`
- `src/pages/pages.service.ts`
- `src/pages/pages.service.spec.ts`
- `src/sections/validation/section-content.registry.ts`

Existing regression scripts also refresh their pre-existing review screenshots. Other dirty files/deletions shown by git were already present from preceding work and are not attributed to this implementation.

## 22. Tests and build results

- Frontend `npm.cmd run lint`: passed.
- Frontend `npm.cmd run build`: passed.
- Backend `npm.cmd run lint`: passed.
- Backend `npm.cmd run build`: passed.
- Backend `npm.cmd test -- --runInBand`: 20 suites passed, one configured integration suite skipped; 100 tests passed, one skipped.
- `node scripts/check-cms-migration.mjs`: passed existing bilingual editor, Radix, media simulation, cluster, and portrait regressions.
- `node scripts/check-cms-routes.mjs`: passed existing public/admin regressions and new detail writing/formatting/media/caption/CTA/locales/save-failure/save-reload/history/publish/preview/TOC/final-CTA checks.
- Backend `node scripts/check-solution-detail.cjs`: passed real PostgreSQL atomic creation/save, second-language failure rollback, draft/publish, locale availability, Redis exact-key invalidation/stale-draft protection, and unauthenticated admin HTTP rejection. It requires the local backend to be running and deletes only its own UUID-prefixed test page/cache keys.
- Real public API smoke: demo VI/EN delivery and availability passed; unknown detail slug returned 404.
- Demo repeat dry-run: zero changes.
- Repository whitespace checks: passed with Windows CRLF accounted for.

Browser scripts use real saved database fixtures read-only, then mock auth/write/Cloudinary responses in an isolated Chrome session. They do not modify the demo/business records. Real database transaction and cache behavior are checked separately by the backend integration script. A live authenticated marketing editing session and live Cloudinary delivery were not claimed as tested.

## 23. Responsive checks

Manager checked at 1440, 1024, and 820 pixels. Public VI/EN checked at 1440, 1024, 820, and 390 pixels. Assertions cover no horizontal overflow, one H1, image nodes, TOC anchor targets, safe/localized booking links, typography width, related modules, CTA, canonical/alternates, and existing public navbar/footer rendering.

Text is capped at 820 pixels; wide/full media use 1000/1100 pixel caps and scale within tablet/mobile containers. Public related links stack on mobile. Selected review screenshots:

- [Public Vietnamese at 1440](solution-detail-public-vi-1440.png)
- [Public English at 1440](solution-detail-public-en-1440.png)
- [Manager at 820](solution-detail-admin-820.png)

## 24. Cache behavior

Reused `cms:page:{slug}:{locale}` and the existing 300-second public page cache. Detail saves invalidate only that slug's VI/EN keys. Slug changes additionally invalidate the new slug and Solutions listing locale keys. Public availability is read independently of cached listing content.

For detail cache hits, current database kind/status/visibility/version are checked before serving the cached document. A stale published Redis record cannot expose a page that has become draft. Cache reads/writes/invalidation retain the existing best-effort behavior; auth/session keys are never invalidated by detail saves.

## 25. Validation and security

Backend strict schemas allow only supported nodes/marks/attributes and H2/H3. Unknown nodes, scripts/iframes, event handlers, styling attributes, unsafe protocols, credentialed URLs, invalid image sources, malformed list/block structures, duplicate media/CTA IDs, and duplicate heading IDs are rejected with HTTP 400. Link destinations allow safe internal paths and HTTP/HTTPS; images allow existing `/assets/` paths and HTTPS Cloudinary delivery URLs.

Documents are bounded to one million serialized characters, 5000 nodes, depth 12, 1000 children per supported container, and 50000 characters per text node. Related references are checked against existing modules. Slugs use validated lowercase kebab case, reject reserved names, and use the database uniqueness constraint. Creation/save are serializable and both languages roll back together on failure. Public rendering escapes text through React and applies the same URL restrictions defensively.

## 26. Intentional limits and deferred features

No autosave, auto-translation, arbitrary styling, advanced article cropping, redirect manager, scheduling UI, revisions/version history, collaborative editing, recommendation engine, WordPress runtime, or SSR/prerendering was added. The saved article preview reuses the public article renderer rather than creating a second editor rendering implementation.

The existing Vite large-main-chunk warning remains (about 633 KB uncompressed); the editor is a separate lazy chunk. npm audit reports pre-existing toolchain advisories in Vite/esbuild/source-map-js, with no Tiptap advisory in the inspected report. Unrelated toolchain upgrades were not bundled into this CMS implementation. The skipped pre-existing integration suite, live Cloudinary upload, and production deployment remain outside the completed local verification.

## Public editorial layout and demo refinement (2026-10-08)

This focused follow-up changes the public presentation and demonstration article only. It supersedes the initial public dimensions and short four-section demo described above. CMS architecture, editor structure, authentication and database schema were not changed.

The public page now uses the existing 1280px page token, a centered 900px header, 800px text/TOC/related column, 1040px cover/wide media, and 1100px full media. Horizontal padding is 24px desktop/tablet and 20px mobile. Main content explicitly clears the fixed navbar (104px top offset, 96px mobile). Breadcrumb, eyebrow and metadata have compact spacing. Header-to-cover spacing is 40px. The cover keeps its natural aspect ratio with a 420px desktop height cap and 300px mobile cap; it is never stretched or cropped.

H1 uses 56px/1.06 at 1440 and 1024, 48px at 820, and 36px/1.08 on mobile. Description uses 24/22/20px respectively. Public body text uses 19px/1.75, or 18px mobile. H2/H3 use 32/24px desktop and 28/22px mobile. Paragraphs use 20px spacing, headings 40px separation, and article media 32px separation. Public article rules are scoped under the detail main container. Related solutions are lightweight text links instead of filled cards. The final page CTA remains after related solutions.

The published HR/payroll demo now has **764 Vietnamese words and 538 English words**, measured from document text: **1302 combined**. It includes an introduction, five H2 sections (employee records, attendance review, payroll checkpoints, reporting, implementation scope), one H3, paragraphs, bullet and numbered lists, two captioned existing NeoTek illustrations plus the cover, one informational callout, related modules, and one final booking CTA. Copy describes practical review processes in neutral terms without invented customer results or unverified product capabilities.

The existing seed script adds an explicit `--refresh-demo` option for this authorized update. Refresh accepts only exact fingerprints of the original unedited hero/article, so subsequent editorial changes cannot be overwritten. The updated document is recognized on repeat runs. Existing related references, SEO metadata, publication state and publication date are preserved during refresh. The refresh was applied locally; repeat dry-run returned `changes: []`.

```powershell
npm.cmd run content:solution-detail-demo -- --dry-run --refresh-demo
npm.cmd run content:solution-detail-demo -- --apply --refresh-demo
```

Files changed in this follow-up:

- Frontend `src/pages/solutions/SolutionDetailPage.jsx`: public main container and breadcrumb class.
- Frontend `src/pages/solutions/SolutionDetailPage.css`: editorial layout, typography, spacing, image sizing and responsive treatment.
- Backend `scripts/solution-detail-demo.ts`: expanded bilingual demo and guarded refresh; no backend application/schema change.
- Frontend `scripts/check-cms-routes.mjs`: five-section fixture expectations and assertions for navbar clearance, title scale, container bounds, cover height, numbered list, captions and bottom CTA order.
- This report; existing VI/EN public review screenshots were refreshed by the regression script.

Verification: frontend lint/build passed, with the existing main-chunk warning. Chrome public VI/EN checks passed at 1440/1024/820/390, including no horizontal overflow, one H1, header clearance, title scale, TOC anchors, captions, image containers and final CTA order. Existing admin route/writing regressions passed. The real public API returned five H2 sections, two article images and a final CTA for both locales. Schema validation and transaction execution passed in the seed command. No additional migration was applied; no commit or push.

### Public metadata and related-content polish

The demo's entire closing `next-steps` section (now titled “Bắt đầu từ phạm vi có thể đánh giá”) and its solution-specific final CTA have been removed in VI/EN, with no replacement CTA. The remaining article has four H2 sections and 1006 combined document words. The shared global footer/CTA remains unchanged. The fingerprint-guarded demo refresh was applied; a repeat dry-run reports no changes.

Editorial metadata now uses small Lucide CalendarDays/Clock3 icons with localized, zero-padded dates, semantic time elements and computed reading time. No decorative article-heading or paragraph icons were introduced.

“Bài viết liên quan” / “Related content” now shows up to four whole-card links, with image thumbnails, real CMS group/category labels, three-line titles and subtle hover/focus treatment. The selected related module keys come first; remaining positions use other real module records, excluding the current solution and duplicates. Published detail records supply their saved localized title, cover and publication/update date. A failed/unpublished detail falls back to the verified Solutions overview. Module-only entries use existing module visuals or their verified project SVG icons and omit dates because module records have no publication timestamps. No fictional records, images or dates were added.

The related grid uses four columns at 1440/1024, two at 820, and one on mobile, across the page container. It has no filled card shells or heavy borders. Article typography and editor structure were not changed.

Unavailable thumbnail requests fall back to the module's existing icon rather than an unrelated stock image. Module records without a visual use that same icon treatment from the start. The browser regression checks that related thumbnails load at desktop and mobile widths.

Changed sources: `SolutionDetailPage.jsx`, `SolutionDetailPage.css`, `scripts/check-cms-routes.mjs`, and backend `scripts/solution-detail-demo.ts`, plus this report and browser review images. No backend application, schema, auth or shared-content changes. Frontend lint/build and the public/admin Chrome regression passed; public assertions verify both languages, 1440/1024/820/390 columns, metadata icons, real thumbnail/title/link data, and absence of the removed closing block. The existing Vite main-chunk warning remains. No commit or push.

## Editorial identity and reading rail refinement

This pass changes only the public detail page, its scoped CSS, browser checks and this report. Article documents, backend, schema, editors and shared footer content remain unchanged.

The header combines the real solution icon and group with a small NeoERP Solution label, saved update date and reading time calculated from the article. At 1200px and above, a 180px reading rail accompanies an 800px text column. A viewport portal avoids the transformed containing block created by the existing ScrollSmoother wrapper. The existing GSAP ticker follows actual article geometry during smooth scrolling and image loads, without changing the global scroll system. The rail highlights the current H2, stops with the article and becomes a native disclosure below 1200px. Its ticker and media listener are removed when the page unmounts.

Public H2 headings gain small 01/02 section numbers and stronger spacing. Existing wide/full media modes expand beyond the body column within the available article canvas. Existing callouts and blockquotes share a reusable typography-led pull-quote treatment with a thin brand-red accent and no alert background. All these rules are scoped to the public detail content; the saved editor preview retains its existing styling.

Related content uses one featured card and up to three smaller records. Desktop uses a featured column beside the smaller cards; tablet uses two columns and a featured row; mobile uses one featured card followed by compact horizontal cards. Existing CMS titles, descriptions, group categories and cover images are reused. Real module icons remain the fallback when no cover exists. Dates and reading times appear only for records with actual published detail metadata/documents.

Changed files: `src/pages/solutions/SolutionDetailPage.jsx`, `src/pages/solutions/SolutionDetailPage.css`, `scripts/check-cms-routes.mjs`, this report, and the existing VI/EN desktop review images. No commit or push.

Validation: frontend lint and production build passed. Chrome public checks passed in VI and EN at 1440/1024/820/390, including active H2 tracking, the rail's viewport position while reading, disclosure opening, 760–820px desktop body readability, mosaic layout, real identity icon, transparent insight styling, loaded related thumbnails, SEO and no horizontal overflow. The existing admin/editor interaction and atomic-save regressions also passed. Git whitespace checks passed; the existing Vite main-chunk size warning remains. Backend tests were not rerun because this pass makes no backend changes.

## Six scoped CMS and public-layout tasks

The CMS adds a dynamic **Chi tiết giải pháp** group under **Trang nội dung**, with **Tất cả bài viết** and real saved Page entries. The manager at `/admin/solution-details` combines existing detail Pages with saved Solutions module records to show names, module, status and last update. It includes search/status filtering and reuses `POST /admin/solutions` with the existing module key and CSRF token to create a draft, then opens `/admin/solutions/:slug`. Missing or conflicting slugs remain explicit errors; no new CRUD backend or content records are introduced automatically. Existing details without a current module match remain editable. The overview card counts published, draft and missing entries.

A lightweight nonmodal Radix Dialog provides overview, section and article tutorials; Radix DropdownMenu exposes replay from the user help control. The spotlight is pointer-transparent, and the tutorial does not trap focus or modify drafts. First display, dismissal/completion and opt-out are persisted per user/context in localStorage. Article steps cover navigation, VI/EN, Tiptap, `/`, image drag/drop, Draft/Published, Save and SEO. No tour dependency or user-preference backend was added.

Desktop public layout now reads **article | TOC**, with an 800px article column, 80px gap, 240px rail and 1120px editorial container. At widths below 1200px, the same TOC becomes a native disclosure above the article. Existing heading IDs, numbering, active-section tracking and article data are preserved. The viewport rail follows the actual navbar height plus 24px and is bounded by the article.

Navbar root cause: GSAP ScrollSmoother transforms the content inside a fixed, overflow-hidden wrapper. A fixed header inside that transformed ancestor follows its containing block, and the special Solutions native-sticky override cannot stick to the window through that wrapper. The scrolled navbar now renders once in a viewport portal outside the wrapper, retaining existing fixed positioning, z-index and visibility behavior. The obsolete native-sticky variant was removed. Home keeps its original hero navbar and scrolled-navbar visibility transitions. The Solutions main content reserves 72px for the fixed header, including English and mobile.

Article content remains white. Related content receives a subtle neutral surface and additional vertical padding; it appears only at the bottom. Shared footer CTA spacing is scoped to Solution Detail, with the existing CTA/footer renderer and content retained. No duplicate TOC or related block, heavy borders, editor redesign, auth/session changes, backend/schema changes, migration apply, production hardening, commit or push.

Created source files: `src/admin/pages/SolutionDetailsManager.jsx`, `src/admin/app/CmsTutorial.jsx`, `src/admin/utils/solutionDetails.js`. Modified sources: `src/admin/app/AdminApp.jsx`, `src/admin/styles/admin.css`, `src/components/layout/NeotekNavbar/NeotekNavbar.jsx`, `src/components/layout/NeotekNavbar/neotek-navbar.css`, `src/pages/solutions/SolutionsPage.css`, `src/pages/solutions/SolutionDetailPage.jsx`, `src/pages/solutions/SolutionDetailPage.css`, and `scripts/check-cms-routes.mjs`. The guide, this report and existing browser review images are updated alongside them.

Saved-data prerequisite: only HR/payroll currently has a shared detail slug. Other modules appear as missing articles; selecting one without matching saved VI/EN slugs shows guidance and a link to the existing module editor. The manager does not invent or save slugs. The browser creation test prepares matching slugs only in its mocked fixture and never writes the real database.

Validation for this six-task pass: frontend lint/build and Git whitespace checks passed. The Chrome suite passed Home/Solutions and manager/sidebar checks at 1440/1024/820/390, and Solution Detail checks in both languages at those widths. New checks cover overview card, dynamic sidebar entries, manager search, missing-slug guidance, existing create API/CSRF/editor navigation, first-context tutorial display, opt-out persistence, replay at all widths, all eight article steps, single right-hand TOC, active H2 tracking, article readability, navbar position while scrolling, responsive disclosure and no horizontal overflow. Existing Tiptap/media/locale/save/dirty-navigation/SEO/shared-logo regressions also passed. API writes and Cloudinary uploads in these tests are simulated; CMS fixtures are read-only. The existing mobile three-line Solutions description treatment is preserved. No backend checks were run because no backend files changed. Existing Vite large-chunk warning remains; production hardening is intentionally deferred.
