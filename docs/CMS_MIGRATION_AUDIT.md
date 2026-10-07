# Home / Solutions CMS migration audit

The public path remains `contentService → backendApiAdapter → NestJS → PostgreSQL`.
No Prisma migration, dependency installation, auth/session change, or WordPress runtime integration was introduced.

| Public section | CMS key / type | Before → now | Editor | Intentionally fixed implementation |
|---|---|---|---|---|
| Home Hero | `home.hero` / `hero` | Dynamic → dynamic | `HeroEditor` (Home) | Carousel behavior, responsive layout, available overlay/alignment options |
| Home Why | `home.why` / `why` | Items dynamic, heading static → dynamic | `BilingualCollectionEditor`, `SectionCopyFields` | Animation/layout |
| Home Solution Overview | `home.solutions` / `solutionOverview` | Static → dynamic | `SolutionOverviewEditor` | Existing icon component allowlist; layout/motion |
| Home Metrics | `home.proofMetrics` / `proofMetrics` | Values dynamic, heading/actions static → dynamic | `BilingualCollectionEditor`, `SectionActionsEditor` | Metric icon associations and number formatting |
| Home Trusted Logos | `home.trustedBy` / `trustedLogos` | Logos dynamic, heading static, sizing rejected → dynamic including sizing | `BilingualCollectionEditor` | Carousel mechanics; safe legacy sizing defaults |
| Home Solution Clusters | `home.solutionClusters` / `solutionClusters` | Items dynamic, heading/labels/CTA static → dynamic | `BilingualCollectionEditor` with cluster hierarchy | Four existing structural cluster identifiers and icon mappings |
| Home Testimonials | `home.testimonials` / `testimonials` | Items dynamic, heading static → dynamic | `BilingualCollectionEditor` | Avatar fallback/layout |
| Home main CTA | `home.cta` / `cta` | Dynamic → bilingual editing + draft preview | `CtaEditor` | Public layout |
| Home footer CTA | `home.footerCta` / existing `cta` type | Static → dynamic | `CtaEditor` with footer-specific actions | Footer layout; only the primary action is shown |
| Home FAQ | `home.faq` / `faq` | Items dynamic, heading/CTA static → dynamic | `BilingualCollectionEditor`, `SectionCopyFields` | Accordion behavior |
| Solutions Hero | `solutions.hero` / `hero` | Dynamic text, fixed destinations → dynamic text/media/actions | `SolutionsHeroEditor` | Left-copy/right-visual layout; only the first slide is public |
| Solutions Trusted Logos | `solutions.trustedBy` / existing `trustedLogos` type | Static heading with no logos → CMS heading and editable logos | `BilingualCollectionEditor` | Starts with an empty logo list, preserving the prior content without copying Home logos |
| Solutions groups/intro | `solutions.groups` / `solutionGroups` | Groups dynamic, intro static → dynamic | `BilingualCollectionEditor`, `SectionCopyFields` | Existing group icon allowlist and alternating layout |
| Solutions modules | `solutions.modules` / `solutionModules` | Dynamic → bilingual text/shared image workflow | `BilingualCollectionEditor` | Accordion/motion; legacy local icon filenames remain supported |
| Solutions CTA | `solutions.cta` / `cta` | Dynamic → bilingual editing + draft preview | `CtaEditor` | Public layout |
| Solutions FAQ | `solutions.faq` / `faq` | Items dynamic, heading/CTA static → dynamic | `BilingualCollectionEditor`, `SectionCopyFields` | Accordion behavior |
| Shared navigation, footer company/address/legal copy | Existing shared i18n/layout | Static | Existing shared layout | Kept outside page-owned sections; a future shared site-content contract should own global company copy rather than duplicating it into Home and Solutions |

## Data population and backward compatibility

`Neotek Backend/scripts/populate-cms-editor-content.ts` copies verified existing VI/EN website copy/media into missing CMS fields. Existing content wins during merging. It populates 18 existing section translations, creates Home's footer CTA using the existing `cta` type, and creates Solutions' Trusted Logos using the existing `trustedLogos` type. The latter starts empty, matching the prior page. Parent cluster labels are filled only when missing.

Run from `Neotek Backend`:

```text
npm.cmd exec -- ts-node scripts/populate-cms-editor-content.ts
npm.cmd exec -- ts-node scripts/populate-cms-editor-content.ts --apply
```

Dry-run validates every payload. Apply writes in one Prisma transaction and invalidates only affected page/locale Redis keys. Re-running the dry-run after applying produces no changes. No database schema migration is required.

Imported VI/EN arrays with different keys or order remain intact. Text-only saves retain legacy structures. Structural controls are disabled until their keys/order are aligned; new items always share a generated key. Keyless imported FAQ/testimonial items receive paired stable keys at the first explicit structural edit, preserving their text and media. Structural saves use the existing atomic bilingual endpoint; single-locale structural changes are rejected.

Global language controls are hidden on bilingual section routes. Page metadata/SEO routes retain the global locale control. All section saves remain section-level; one page-detail response supplies both locales. Public concurrent page requests are deduplicated without adding a stale content cache.

## Admin/media/layout changes

- `AdminSelect` uses Radix Select, including keyboard navigation and portal styling.
- `ConfirmProvider` uses Radix AlertDialog for deletion, image removal, discard, navigation and logout guards, with focus restoration.
- Rich-text link creation uses Radix Dialog, retaining the compact toolbar and selected text. Browser `beforeunload` protection remains because browser document unload cannot await a custom dialog.
- Home and Solutions Hero resolve separately through `resolveEditor({ pageSlug, sectionKey, type })`.
- Logo/media/icon fields reuse `ImageField` and the existing signed Cloudinary uploader. No binary content is stored in PostgreSQL.
- Logos support optional width, max width, scale, height constraint and object-fit; old content keeps safe defaults.
- Solutions uses the existing wide-container token, wrapping hero lines, full descriptions without line-clamping, and tablet stacking. Typography was not shrunk to address clipping.
- Public rich-text descriptions are normalized to text where their existing public components render paragraphs, avoiding literal HTML tags.
- Duplicate section title/kicker/description were removed below the page header.

## Files changed in this task

Frontend:

- `src/admin/AdminApp.jsx`, `CmsProvider.jsx`, `pages/PageEditor.jsx`, `sectionMetadata.js`, `admin.css`.
- `src/admin/components/AdminSelect.jsx`, `ConfirmProvider.jsx`.
- `src/admin/components/section-editors/registry.js`, `EditorControls.jsx`, `HeroEditor.jsx`, `CtaEditor.jsx`, `ImageField.jsx`, `RichTextField.jsx`, `SolutionClustersEditor.jsx`.
- New section editor helpers: `BilingualCollectionEditor.jsx`, `SectionCopyFields.jsx`, `SectionActionsEditor.jsx`, `SolutionOverviewEditor.jsx`, `SolutionsHeroEditor.jsx`.
- `src/pages/home/HomePage.jsx`, `src/pages/solutions/SolutionsPage.jsx`, `SolutionsPage.css`.
- `src/services/content/adapters/backendApiAdapter.js`.
- Public sections: `WhySection`, `SolutionsSection`, `ProofMetricsSection`, `TrustedBySection`, `SolutionClustersSection`, `TestimonialsSection`, `FAQSection`.
- `src/components/layout/NeotekFooter/NeotekFooter.jsx`.
- `scripts/check-cms-migration.mjs`, `scripts/check-cms-routes.mjs`, this audit.

Backend:

- `src/admin/admin.service.ts`, `admin.service.spec.ts`.
- `src/sections/validation/section-content.registry.ts`, `section-content.registry.spec.ts`.
- `scripts/populate-cms-editor-content.ts`.

Pre-existing uncommitted auth, media, dashboard and migration changes were retained. Legacy editor exports were retained to protect existing work; the current registry routes supported sections through the bilingual editor flow.

## Validation and practical limits

Frontend: `npm.cmd run lint`, `npm.cmd run build`; Chrome component checks and public/admin route checks.

Backend: `npm.cmd test -- --runInBand`, `npm.cmd run lint`, `npm.cmd run build`. The existing skipped integration test remains skipped.

Browser component checks use real React/Radix components with mocked media signing/direct-upload responses. Route checks use the production frontend build and a read-only snapshot of local PostgreSQL page data, with mocked authenticated API responses and saves. They check VI/EN public routes at 1440, 1024 and 820px; text overflow/clamping; overview/footer rendering; editor loading; locale controls; dirty navigation cancellation/acceptance; Back/Forward guards; atomic save payloads; and duplicate fetches. Browser checks verify nonempty media URLs, not availability of every external image host.

Remaining follow-ups: live authenticated Cloudinary upload; editorial alignment of existing divergent VI/EN keys; a shared global footer/company-copy contract if that content must also be editable. Existing `/demo` and `#contact` destinations were preserved from the website; this task does not create missing destination routes or contact sections.
