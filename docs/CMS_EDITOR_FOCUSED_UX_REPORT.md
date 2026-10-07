# Focused CMS editor UX pass — 2026-10-07

1. Removed settings/list layers for small collections and Content/Image layers in Why, Testimonials, Trusted, Group/Module and Overview. Hero modes, record selection and Metrics list/actions remain.
2. `MediaEditDialog` uses Radix Dialog and a local portrait draft. Drag or arrow keys reposition a square focus frame; zoom, replace and confirmed remove use existing media controls. Cancel/close discard local edits; Apply transfers image/focalX/focalY/zoom to the section draft. Section save persists. Original sources are retained, not cropped.
3. Why shows bilingual title/description and a compact square image inline.
4. Removed CTA/footer previews, standalone testimonial-card preview and their unused lazy wrappers. Retained Hero, one draft Trusted marquee and useful Group/Module renderer previews.
5. Trusted shows bilingual alt text, full-contain media, width and scale together. Draft sizing/media update the real marquee immediately.
6. Cluster tabs select a parent. Parent label/title/description/image appear first, followed by “Phân hệ trong cụm” child accordions. Children edit only their consumed title. Legacy unassigned records remain visible. Parent records never enter the child list.
7. Main CTA has bilingual content and compact action rows, without tabs. Radix type selection, shared destination and enabled state are consumed by the public renderer.
8. Footer CTA uses the same editor with only its existing primary action. Content remains distinct from main CTA. Default styling is unchanged; explicitly selected outline/link styles and visibility are supported.
9. `SharedCtaEditor` reuses `CtaEditor`; Home/Solutions reuse `CtaView`. Their current main CTA JSON is identical for VI and EN. Footer CTA has different business copy and its own canonical key.
10. `SharedFaqEditor` reuses the collection editor and existing public `FAQSection`. Home/Solutions FAQ JSON is identical for VI and EN.
11. `SharedTrustedEditor` reuses the collection editor and `TrustedByView`. Home has ten logos; Solutions currently has none. These sources stay distinct to preserve current content.
12. Canonical read/write infrastructure is implemented; actual database migration has **not** been applied. Existing inline data remains supported. No Prisma schema migration is needed.
13. Backend `scripts/share-cms-content.cjs` supports `--dry-run` and `--apply`. Dry-run was executed first. The exact section/translation IDs and content hashes are in `CMS_SHARED_CONTENT_DRY_RUN.json`. The plan creates 5 SiteSetting records and 10 SiteSettingTranslation records, then replaces 14 existing PageSectionTranslation content values with references. Seven existing sections retain their IDs, keys, type, order and visibility. Apply is transactional, rechecks content equality, rejects canonical conflicts, skips existing references on subsequent runs and invalidates exact Home/Solutions CMS cache keys only.
14. Resolved admin sections include source and consuming-page metadata. A subtle info indication appears only for multiple consuming pages. It is browser-tested with mocked resolved API metadata; live badges appear after activation.
15. Files changed in this pass are listed below. Existing unrelated dirty files were preserved.
16. Frontend full lint, production build and both Chrome regression scripts passed. Cloudinary signature/upload requests are simulated in the interaction checks. Vite retains its existing large-chunk warning.
17. Backend full lint/build passed; 71 tests passed and one configured integration test was skipped. Added canonical locale resolution, missing-locale failure, atomic shared save, exact consumer-cache invalidation, structural safety and public Home/Solutions resolution coverage.
18. Chrome checks cover Home Why/Testimonials/Trusted/Clusters/Overview/CTA/footer/FAQ and Solutions CTA/Trusted/FAQ/Groups/Modules at 1440/1024/820, plus public VI/EN routes. Portrait modal bounds, hidden numeric coordinates, clean status after close, no unnecessary field tabs and no horizontal overflow are checked. Screenshots are recorded in docs.
19. No database writes, business-copy changes, source-image removal, translated-key normalization, auth/session edits, Prisma migration, commits or pushes were performed. VI/EN edits and existing legacy structural keys are preserved. Exactly one section status is shown beside the title for clean/dirty/pending/error; action bars do not repeat it.
20. Deferred: explicitly applying the reviewed migration; deciding whether empty Solutions Trusted content should intentionally share Home logos; real Cloudinary upload validation for this dialog. Module detail routes remain outside this pass.

## Canonical strategy

`PageSectionTranslation.content = { "source": "shared.faq" }` references a `SiteSetting.key`. Each canonical translation stores the original complete localized section JSON in `SiteSettingTranslation.value`. Public/admin reads resolve the requested locale without VI fallback. Existing guarded admin section-save endpoints validate the usual content schema and atomically update canonical VI/EN values. Page layout, visibility and ordering remain page-specific. All actual consuming page/locale cache keys are invalidated; auth keys are untouched. No new endpoints or authentication changes.

| Canonical key | Existing sections to reference it |
| --- | --- |
| `shared.cta` | Home `cmuu7lccu001cdrskmelnj7vv`; Solutions `cmuu7lcgs002bdrskglbrm55d` |
| `shared.faq` | Home `cmuu7lcdg001idrsk7isxysto`; Solutions `cmuu7lche002hdrskfs087ffz` |
| `shared.footerCta` | Home `cmuwym9dv0001dra0b9jddypc` |
| `shared.trustedLogos.home` | Home `cmuu7lcax000udrskqm6hdh8q` |
| `shared.trustedLogos.solutions` | Solutions `cmuwzewz40001drts6u6eh6p0` |

Run from `Neotek Backend`: `node scripts/share-cms-content.cjs --dry-run`. Review the current output before deliberately running `--apply`. Deploy the resolver backend before activating references. Keep a database backup for operational rollback; the script does not overwrite a conflicting canonical source.

## Files changed in this pass

Frontend editor code: `src/admin/components/section-editors/{BilingualCollectionEditor,EditorPrimitives,CtaEditor,AvatarField,MediaEditDialog,ImageField,SolutionOverviewEditor,PreviewViews}.jsx`, `registry.js`, `src/admin/pages/PageEditor.jsx`, `src/admin/admin.css`.

Frontend public behavior: `src/services/content/adapters/backendApiAdapter.js`, `src/components/sections/CTASection/CTASection.jsx`, `src/components/layout/NeotekFooter/{FooterCtaView.jsx,NeotekFooter.css}`.

Verification/docs: `scripts/check-cms-migration.mjs`, `scripts/check-cms-routes.mjs`, this report, `ADMIN_CMS_GUIDE.md`, `CMS_SHARED_CONTENT_DRY_RUN.json`, portrait screenshot and refreshed existing editor snapshots.

Backend: `src/admin/admin.service.ts`, `src/pages/pages.service.ts`, `src/sections/{shared-content.ts,shared-content.spec.ts}`, `src/sections/validation/section-content.registry.ts`, `scripts/share-cms-content.cjs`.
