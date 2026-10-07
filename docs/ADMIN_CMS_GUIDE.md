# Neotek CMS User Guide

## 1. What this CMS manages

The CMS manages the public Neotek **Home**, **Solutions**, and editorial **Solution Detail** pages in Vietnamese and English. Home and Solutions are made of sections, such as a hero banner, testimonials, a call to action, or frequently asked questions. Solution Detail pages have a dedicated bilingual writing manager.

## 2. Starting the local system

```bash
docker compose up -d
```

In separate terminals:

```bash
npm run start:dev
npm run dev
```

Optional database inspection:

```bash
npx prisma studio
```

- Public site: http://localhost:5173
- CMS: http://localhost:5173/admin
- Backend: http://localhost:3000/api
- Prisma Studio: http://localhost:5555

## 3. Logging in

There is no public admin registration. An administrator account is created by the backend bootstrap process. Open `/admin` and use an account provided by the Neotek administrator. Never place passwords or tokens in content.

## 4. Pages

Choose Home or Solutions from the Pages screen. A slug is the internal web name, such as `home` or `solutions`. Status controls whether a page is draft or published.

## 5. Languages

Vietnamese and English are edited side by side. Localized text remains independent; shared media, navigation and display controls update both versions. Section Save submits VI and EN atomically. Check both languages before publishing.

## 6. Sections

A section is one content block on a webpage. Common examples are Hero, CTA, FAQ, and Testimonials. Section key and type are technical identifiers; normally do not change them.

## 7. Editing content

1. Choose a page.
2. Review the VI and EN columns.
3. Choose a section from Page content.
4. Edit the visual fields.
5. Save the section.
6. Review the draft preview, where available.
7. Check the public page.

## 8. Typed editors

All supported Home and Solutions sections have visual editors. Hero, Why, Testimonials, Groups, Modules and Metrics use content/media/navigation tabs where useful. FAQ keeps accordion interaction. VI and EN columns resize independently.

## 9. Images

Drag one PNG/JPG/WebP/GIF/AVIF image into the media field, or click to select. Files must be at most 10 MB. The signed Cloudinary flow stores a secure URL; PostgreSQL does not store the image binary. Replace and Remove are compact icon controls on the preview. Uploading blocks duplicate actions. Save the section after uploading.

Generic previews show the complete image. Why uses a compact square preview without changing the source asset. Testimonial avatars have a separate square focal preview: drag to reposition, use X/Y for keyboard adjustment, and zoom from 1 to 2.5. Logo width controls the slot and scale controls the image; the live strip updates before saving. There is no JSON or manual URL editor in the normal workflow.

## 10. Preview

Hero and CTA draft previews reuse their public visual renderers. Home Hero and Solutions Hero retain different layouts. Trusted Logos uses the public marquee renderer, and Testimonials reuses a public card. Draft previews reflect unsaved content; preview links do not navigate. “View saved page” opens server content, which changes only after Save succeeds.

## 11. Visible / hidden sections

Use **Visible on website** to show or hide a section. Hiding does not delete its content.

## 12. Display order

Use Move up and Move down to change order. Repeated-item Delete uses a confirmation dialog; its effect is saved with the section. Legacy VI/EN lists are paired by exact key first, then by compatible position. Text remains editable, but add/delete/reorder stays locked when the original structures differ. Display pairing never rewrites stored keys or copies one language into the other. There is no section-delete API; use the visibility control to hide a complete section.

## 13. SEO

SEO title and SEO description help search engines and link previews describe the page. Keep them clear and appropriate to the selected language.

## 14. ADMIN vs EDITOR

ADMIN users can manage page settings, create sections, and edit content. EDITOR users see only the controls allowed by the current backend permission policy.

## 15. Common problems

- **Cannot log in:** check that the backend and Redis are running, use the correct account, and try again after the session expires.
- **Changes do not appear:** save first, refresh the preview, and check that the backend/cache are running.
- **CMS/API unavailable:** check `http://localhost:3000/api/health`.
- **Save fails:** the draft remains available. Check required fields, retry, or Discard to return both languages to the last saved version.
- **Legacy list warning:** text is editable, but structural edits require reviewed normalization by a maintainer. Do not edit database keys casually.

## 16. Database

Prisma Studio is useful for inspection. Prefer the CMS for normal edits and do not manually modify production data through Prisma Studio.

## 17. Safe operating rules

- Do not casually change section keys or types.
- Do not paste secrets into content.
- Check both Vietnamese and English.
- Save before checking the public page; draft previews work before saving.
- Avoid changing structural data without understanding its effect.

## 18. Shared editor composition and verification

All normal bilingual fields, including page SEO and section settings, use `BilingualPanel`: exactly two `.admin-language-panel` sections headed VI and EN. Panels use the same surface, padding, radius and 12 px field rhythm. They align independently, with two columns on desktop and one at 1024/820. Resizing VI does not stretch EN.

`EditorPrimitives.jsx` owns `EditorTabs`, `BilingualPanel`, `EditorSection`, `EditorItemTabs`, `EditorActionBar` and `MediaPanel`. Radix handles tab focus and keyboard navigation. Item tabs include a contextual add button and display only the selected item. Both item delete/reorder and section save controls compose the same action bar; saving remains atomic at section level.

| Editor | Selected-item groups |
| --- | --- |
| Home Hero | Content / Images / Actions / Settings |
| Solutions Hero | Content / Images / Actions |
| CTA and Footer CTA | Content / Navigation |
| Testimonials | Content / Avatar |
| Why | Content / Images |
| Solution Groups | Content / Modules / Illustration |
| Solution Modules | Content (including features and CTA) / Images |
| Solution Overview | Content / Media / Navigation |
| Trusted Logos | Content / Display, with the live marquee immediately below |
| FAQ | Accordion with the shared bilingual panel |

Section copy is available under **Section settings**, separate from the item list, which opens by default. Testimonials uses **Section settings / Reviews**. Trusted logo upload is under Content; Display holds width/scale, and the public marquee remains visible immediately below with current draft data. CTA navigation uses one row per button: type, VI label, EN label, shared link.

Exceptions follow existing contracts: Solutions Hero has one public slide and no consumed background/overlay settings, so it has no slide selector or empty Settings tab. FAQ remains an accordion. Compact CTA label rows intentionally combine both labels with one link. Complete sections can be hidden; there is no section-delete API. Legacy unmatched structures retain editable text but lock structural operations. Compatibility exports for old editor filenames delegate to the current registry; they no longer contain separate UI implementations.

Obsolete Hero language cards, loose bilingual columns, custom Hero/page/item tab styles, logo layouts and unused long-form/sticky editor rules were removed. Shared composition styles live in one block in `admin.css`; media, focal/zoom and public renderer behavior are preserved. This correction changes no backend schema, authentication, cache or public content contract.

Validation commands:

- `npm.cmd run lint`
- `npm.cmd run build`
- `node scripts/check-cms-migration.mjs`: browser interaction and payload regression with simulated signed uploads.
- `node scripts/check-cms-routes.mjs`: production build, read-only Home/Solutions database fixtures, mocked auth/save API, public and admin routes at 1440/1024/820, every field-group tab, common language surfaces, independent textarea resizing, save/discard/navigation guards. No database writes.

Review screenshots generated by the route check:

- [Solutions Groups, 1440](admin-editor-solutions-solutionGroups-1440.png)
- [Home Hero, 1024](admin-editor-home-hero-1024.png)
- [Testimonials, 820](admin-editor-home-testimonials-820.png)

Live Cloudinary uploads are not repeated by this architecture regression; signing/upload requests are simulated. No dependencies, commit or push are part of this correction.

## 19. Solutions hierarchy refactor

The module editor reads the current Solutions group records and their `modules` arrays. Its first rail selects a group; its second rail selects one of that group's modules. A module referenced by several groups is edited in the same underlying `items[]` record, never duplicated. Unassigned modules remain accessible under **Ungrouped**. New modules start there; assign their keys from the Groups editor after saving the Modules section. Membership stays on Groups and saves atomically with both group translations. No structural keys are translated or automatically rewritten.

Module Content contains independent VI/EN title, description and feature lists. `ListInput` trims new entries, adds on Enter, ignores empty/duplicate entries and provides an accessible remove control. Existing `bullets[]` values are not normalized on load. The CTA row edits VI label, EN label and one shared slug.

The primary visual is `visualSrc`, with the existing signed Cloudinary drag/drop upload and contain preview. The legacy icon remains a compact optional accordion icon under a disclosure because the public accordion still consumes it. Groups uses the actual public Hugeicons sources in its Radix icon selector. Image-position selects also show meaning-bearing alignment icons.

Groups and Modules show bilingual unsaved previews immediately below their field tabs, through the real public `SolutionCluster` renderer and `DraftPreview`. Hero preview stays present below settings. CTA keeps its real draft preview below fields. Trusted keeps its public marquee below Content and Display, rather than behind a Preview tab. On smaller screens the shared panels stack.

Clean section status appears once near the section title. Dirty/saving/error state and save/discard controls belong to the action bar. No second clean saved badge appears beneath the editor. Text action arrows and plus/minus controls were replaced with Lucide icons; item rails shrink and truncate within available width, hide native scrollbars, and support wheel/focus scrolling for large lists.

### Detail routes and deferred work

`App.jsx` currently has `/solutions` and `/en/solutions`, but no module detail routes or dynamic detail renderer. This includes the screenshot example `/solutions/nhan-su-tien-luong`: it currently reaches the bilingual 404. `solutionPresentation.js` keeps the verified detail-slug registry empty. Public CTAs are visibly disabled until an actual detail page/route exists; the editor shows the slug's planned destination as a preview, not a working link. No full detail pages or guessed routes were added. All 11 existing modules currently lack implemented detail pages.

The JSON section validator now accepts optional `slug` (lowercase kebab case or blank) and localized `ctaLabel`. Existing records remain valid. No Prisma migration, database write, auth/session change or WordPress dependency was introduced. Implement and register detail pages before enabling their CTAs; synchronize the verified slug registry with those routes.

### CSS audit

- Reviewed 340 unique selectors; 41 repeated base selector definitions were identified before cleanup.
- Removed 117 dead selector entries across 98 rules, covering 37 unused classes.
- Merged 40 redundant base rules across 29 retained selectors. Duplicates belonging to removed dead selectors disappeared with those rules.
- Retained nine explicit responsive/accessibility blocks because they change sidebar/layout widths, language stacking, media grids, tab/navigation layout, or reduced-motion behavior. They follow component bases intentionally.
- Kept one stylesheet with component sections; no additional override stack or CSS file system was added.

### Files in this pass

Frontend: `AdminApp.jsx`, `PageEditor.jsx`, `AdminSelect.jsx`, `admin.css`; `EditorPrimitives.jsx`, `EditorControls.jsx`, `BilingualCollectionEditor.jsx`, `ListInput.jsx`, `ImagePositionField.jsx`, `SectionActionsEditor.jsx`, `SolutionOverviewEditor.jsx`, `SolutionDraftPreview.jsx`, `PreviewViews.jsx`; `SolutionsPage.jsx`, `SolutionsPage.css`, `solutionPresentation.js`, `backendApiAdapter.js`; both current browser regression scripts and this guide. Backend: only `section-content.registry.ts` and its specification. Public Home markup/content was not changed.

Verification covers Home/Solutions in VI/EN, the existing missing-detail-route 404 behavior, grouped module navigation, shared-module/unassigned fixtures, feature list input, Cloudinary request simulation, focal/zoom, save/discard/navigation guards and layouts at 1440/1024/820. The route script records module screenshots for all three widths as well as existing Hero/Groups/Testimonials snapshots. No commit or push.

Current module keys lacking detail pages: `crm`, `sales`, `purchasing`, `warehouse`, `logistics`, `production`, `maintenance`, `projects`, `hrPayroll`, `finance`, `forecast`. Their slugs are not inferred or written into existing content.

Final checks passed: frontend lint/build and both Chrome regression scripts; backend lint/build and 65 tests (one configured integration test skipped); both repository diff whitespace checks. Vite still reports the existing large main-chunk warning (approximately 626 KB). CSS has zero repeated exact base selectors after consolidation.

Module screenshots reviewed: [1440](admin-editor-solutions-solutionModules-1440.png), [1024](admin-editor-solutions-solutionModules-1024.png), [820](admin-editor-solutions-solutionModules-820.png), and [Media with adjacent draft preview](admin-editor-module-media-preview-1440.png).


### Focused inline editors and shared source preparation (2026-10-07)

The current editor flow replaces lightweight field tabs with inline groups. Portrait editing uses a cancellable local Radix dialog; section save remains the persistence boundary. Canonical SiteSetting references, shared-save cache invalidation and the reviewed dry-run plan are documented in [CMS_EDITOR_FOCUSED_UX_REPORT.md](CMS_EDITOR_FOCUSED_UX_REPORT.md). The database migration has not been applied. Existing copy, images and structural keys remain unchanged.

### Repository cleanup (2026-10-07)

The current structure, renamed paths, removed wrappers and verification are recorded in [ADMIN_CMS_CLEANUP_REPORT.md](ADMIN_CMS_CLEANUP_REPORT.md), with the complete [source inventory](ADMIN_SOURCE_INVENTORY.md) and [move manifest](ADMIN_SOURCE_MOVES.json). Admin entry/providers now live in `src/admin/app`, configuration in `config`, editors in `editors`, utilities in `utils`, and the single scoped stylesheet in `styles`. Auth and the established `src/services/admin` transport boundary remain in place.

The confirmed shared-content plan now has one canonical source each for CTA, FAQ and Trusted Logos, plus separate Footer CTA. This supersedes the preceding report's separate Trusted Logos proposal. [CMS_SHARED_CONTENT_DRY_RUN.json](CMS_SHARED_CONTENT_DRY_RUN.json) contains the updated four-source plan; no migration was applied.

### Solution Detail CMS (2026-10-08)

Solution Detail routes are now implemented; this supersedes the earlier deferred-detail-route notes. In Solutions Modules, save a shared module slug, then select **Tạo trang chi tiết** or **Chỉnh trang chi tiết**. The dedicated manager is `/admin/solutions/:slug`.

Use the local Tiếng Việt/English buttons for independent article drafts, **Thông tin đầu trang** for the paired hero, and **SEO** for localized metadata. Type directly in the article; use `/` to insert content and select text for formatting. Click an image for replacement, localized captions and controlled display widths. CTA editing offers inline or final page placement. Use **Cài đặt** to change the shared slug, visibility, and publication state. Select **Đã xuất bản** and explicitly save to publish. Ctrl/Cmd+S also saves both languages atomically. Empty English content is not exposed publicly.

The labeled HR/payroll demo is available at `/solutions/nhan-su-tien-luong` and `/en/solutions/nhan-su-tien-luong`. The detail-kind migration and idempotent demo population were applied locally; the existing shared-content migration was not run by this implementation. Complete architecture, APIs, files, commands, test evidence and limits are recorded in [SOLUTION_DETAIL_CMS_REPORT.md](SOLUTION_DETAIL_CMS_REPORT.md).

### Solution Detail manager and tutorial

The third group under **Trang nội dung** is **Chi tiết giải pháp**. **Tất cả bài viết** opens `/admin/solution-details`; individual entries open the existing `/admin/solutions/:slug` editor. The sidebar loads saved Page records dynamically, while the manager also shows saved Solutions modules without a detail as **Chưa có**. It displays localized names, module, status and last update, with text search and a status filter. **Tạo bài viết** selects an existing module without a detail and uses the existing create-detail API to create a draft; it does not create duplicate module content. Modules need a saved shared slug before creating a detail. The overview card summarizes published, draft and missing entries.

The help button beside the current user offers **Xem lại hướng dẫn** for the current context. Overview, section editors and Solution Detail editors each show their tutorial once. **Bỏ qua hướng dẫn**, Close, Escape or completion dismiss it; **Không hiển thị lại** persists the suppression choice. Preferences are local to this browser and user, stored under `neotek:cms:tutorial:v1:<user>:<context>` in localStorage. Clearing browser storage resets them. The Radix tutorial is nonmodal, does not trap focus or block the editor, and never writes article data. The article walkthrough covers navigation, VI/EN, Tiptap, slash commands, image drag/drop, publication state, saving and SEO.
