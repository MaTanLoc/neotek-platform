# Production readiness audit — Phase A

Audit date: 2026-10-08. **Historical Phase A baseline. Production deployment is not approved. See Phase B/C resolutions below for current source status.**

Scope: `neotek-platform` / Neotek Frontend checkpoint `2cfa8212` and `neotek-backend` / Neotek Backend checkpoint `5d51166`. Frontend paths below are relative to its repository; backend paths explicitly carry `Backend:`. This document is the single audit source for both repositories. Companion documents: [environment](ENVIRONMENT_REFERENCE.md), [proposed deployment gates](DEPLOYMENT_RUNBOOK.md), [proposed backup procedure](BACKUP_RESTORE.md).

Only documentation was changed. No package upgrades, application fixes, schema changes, database writes, migration applications, seed execution, Dockerfiles, commits or pushes. Fourteen pre-existing deleted screenshot artifacts were preserved. Local read-only database checks are evidence about development, not proof of production infrastructure settings. Provider firewalls, WAF, secret storage, Cloudinary preset policy and backups were not accessible for verification.

## Findings and acceptance decisions

Impact notation: **D** persisted data; **S** schema; **R** runtime; **Sec** security. `none` means no intended impact in that category. Complexity: small / medium / large. Each row includes component/files, observed behavior, risk, proposed remedy and impact. Conditional release blockers remain gates until verified; they do not assert an existing public production deployment.

### BLOCKER

| ID | Component and files | Current behavior and risk | Recommended fix; complexity; impacts |
| --- | --- | --- | --- |
| B01 | Public pages; Backend: `src/pages/pages.service.ts`, `prisma/seed.ts` | Only Solution Detail enforces PUBLISHED. Standard cache hits return without status checks; standard DB reads also lack publication checks. Read-only DB found Home, Solutions and `admin-test` DRAFT; GET Home and `admin-test` returned 200 with content. Draft content is public. Seed also resets existing Home/Solutions to DRAFT. | Enforce publication for every public page, including stale cache paths, and test unpublish/cache failure. Separately review intended Home/Solutions publication before any data update. Do not silently publish test pages. Medium; D: reviewed publication updates only, S: none, R/Sec: public visibility. |
| B02 | Backend entry point; Backend: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json` | `start:prod` runs `node dist/main`; existing output and isolated TypeScript build have `dist/src/main.js`, no root main. Production process cannot start with the declared command. | Point start command to verified output or separately review compilation roots. Prefer minimal command correction. Small; D/S: none, R: startup, Sec: none. |
| B03 | Public customer-auth placeholders; `src/pages/auth/Login.jsx`, `Register.jsx`, `src/App.jsx`, `src/components/layout/NeotekNavbar/NeotekNavbar.jsx` | Forms log passwords and registration personal data to console. No customer authentication API is implemented; live navigation/CTAs expose these forms. | Remove credential logging and gate placeholder routes plus all entry links. Keep admin auth separate. Small/medium; D/S: none, R: public route availability, Sec: credential handling. |
| B04 | FAQ stored HTML; Backend: `src/sections/validation/section-content.registry.ts`; `src/services/content/adapters/backendApiAdapter.js`, `src/components/sections/FAQSection/FAQSection.jsx`, `src/admin/editors/shared/RichTextField.jsx` | FAQ answer is unrestricted `z.string()`, adapter passes it unchanged, public FAQ uses `dangerouslySetInnerHTML`. Editor-only `cleanHtml` does not protect API writes/imported records. Event handlers, unsafe URLs and arbitrary HTML can reach a public HTML sink. This is distinct from the safely allowlisted Solution Article JSON renderer. | Enforce a reviewed HTML allowlist at a trusted boundary, sanitize public rendering defensively, test scripts/event attributes/URLs/iframe/styles, inventory existing values before normalization. Medium; D: existing-content cleanup requires review, S: none, R/Sec: rendering and stored-XSS protection. |
| B05 | Private infrastructure gate; Backend: `docker-compose.yml`, `.env.example`; production network configuration absent | Compose publishes DB `5433:5432` and Redis `6379:6379` on unspecified host interfaces; Redis has no configured auth/TLS. This is a development setup, not a production-safe deployment template. Actual internet reachability was not tested. | Do not promote this Compose file. Verify private DB/Redis endpoints, network ACLs, authenticated Redis and transport policy before release. Medium; D/S: none, R/Sec: deployment/network policy. Provider/network decisions require acceptance. |
| B06 | Recovery release gate; no established backup/restore evidence | No repository evidence of automated off-server backups or a successful isolated restore drill. A volume/AOF is not a tested recovery plan. | Accept RPO/RTO, automate backups, run and record a staging restore drill before production. Medium; D: isolated drill only, S: none, R/Sec: operational recovery. Destructive drill operations require a specifically isolated approved target. |

### HIGH

| ID | Component and files | Current behavior and risk | Recommended fix; complexity; impacts |
| --- | --- | --- | --- |
| H01 | Production environment; `src/config/api.js`, `.env.example`; Backend: `src/main.ts`, `.env.example` | Frontend falls back to localhost API; freshly built index JS contains `localhost:3000`. Backend production check only requires FRONTEND_URL and REDIS_URL presence. NODE_ENV, URL validity, wildcard origins, database transport and media configuration lack comprehensive validation. | Validate public API build configuration and backend environment before startup; require intentional production mode, exact origins and critical dependencies; permit explicit media-disabled policy only if accepted. Medium; D/S: none, R/Sec: startup/configuration. |
| H02 | Redis availability; Backend: `src/cache/cache.service.ts`, `src/pages/pages.service.ts` | Redis connect/reconnect/offline queue and command deadlines are not bounded by application policy. Error handlers fail closed when commands reject, but pending commands can hang startup, health and requests. | Bound connect/commands, define retry/offline behavior; cache may degrade to DB, auth must fail closed. Test real outage/recovery against isolated Redis. Medium; D/S: none, R/Sec: availability/session policy. |
| H03 | Readiness/shutdown; Backend: `src/health/health.controller.ts`, `src/main.ts`, `src/prisma/prisma.service.ts` | Health returns HTTP 200 even with status error; checks have no deadlines. Shutdown hooks are not enabled despite provider destroy hooks. | Separate or define bounded liveness/readiness, readiness 503 on dependency failure, enable and test graceful signal drain. Medium; D/S: none, R: restart/health, Sec: none. |
| H04 | Abuse/proxy controls; Backend: `src/auth/login-rate-limit.guard.ts`, `src/main.ts`, `src/media/media.controller.ts`; infrastructure absent | Login has Redis-backed 5/IP/minute protection. No trusted-proxy strategy, account-level brake, broader upload/API quotas or verified edge WAF exists. Behind a proxy, IP limits can collapse all users into one IP; direct backend access could bypass edge controls. | Define trusted hops explicitly, private origin access, CDN/WAF and proxy request/connection/time limits; scoped media/API/account controls. Do not blindly trust arbitrary X-Forwarded-For. Medium/large; D/S: none, R/Sec: abuse controls. |
| H05 | Canonical routing and legacy links; `src/components/layout/NeotekNavbar/NeotekNavbar.jsx`, `src/pages/solutions/solutionPresentation.js`, `src/admin/config/previewRoutes.js`, `src/i18n.js`; Backend: `src/pages/solution-detail.ts` | HR uses one shared slug `nhan-su-tien-luong` in VI/EN modules and Page. Navbar still links `/solutions/hr-payroll` in two static structures. No permanent redirect implementation. `hr-solution` was not found in current source. Ten other modules have no slug in either locale. | Reuse one solution-path builder; bind real module slugs; permanently redirect verified old linked `hr-payroll` paths preserving locale. Only add `hr-solution` alias if historical evidence confirms it. Never invent destinations or new detail pages. Medium; D: optional reviewed missing-slug configuration, S: none, R/Sec: URLs, no auth change. |
| H06 | Shared-content state; Backend: `src/sections/shared-content.ts`, `scripts/share-cms-content.cjs`; `src/admin/pages/PageEditor.jsx` | Live SiteSetting keys are site.navigation, site.footer, shared.trustedLogos. Home/Solutions Trusted references match shared.trustedLogos in VI/EN. CTA/FAQ still contain inline JSON; shared.cta/shared.faq are absent. Footer CTA is separate inline content. Architecture supports sharing but the full data migration is not complete. | Dry-run and compare CTA/FAQ first; resolve divergent copies with business approval, then explicitly apply canonical references. Keep Footer CTA semantically separate. Medium; D: content-reference migration, S: none, R: sharing/cache, Sec: none. Do not auto-apply. |
| H07 | Login boundary/input limits; Backend: `src/auth/auth.controller.ts`, `src/main.ts`, `src/sections/validation/section-content.registry.ts` | Admin mutations and logout use CSRF plus exact Origin guards. Login has rate-limit guard but no Origin guard. Login accepts extra fields and unbounded email; standard section strings/lists lack many size bounds. Zod strict schemas protect many CMS payload keys, so lack of ValidationPipe is not lack of all validation. JSON middleware is installed after Nest defaults; effective limit needs integration verification. | Strict bounded login/section input, exact login-origin policy, configure parser limits at creation and test 413 behavior. Medium; D/S: none, R/Sec: request acceptance. CSP must complement sanitization, not replace it. |
| H08 | Cloudinary policy; Backend: `src/media/media.service.ts`; `src/services/admin/mediaUpload.js`, `src/admin/editors/shared/MediaField.jsx` | Signed uploads, backend-only secret, accepted-format signing, unique public IDs, overwrite=false, secure_url checks and client 10MB limit exist. Server-enforced preset max size, account permissions and quotas cannot be confirmed from code; signature endpoint has no media-specific rate limit. | Verify signed preset enforces formats/size, add scoped quotas/rate limits and test rejection; never expose secret or weaken signature checks. Medium; D/S: none, R/Sec: upload policy. Live Cloudinary upload was not exercised. |
| H09 | PostgreSQL production policy; Backend: `src/prisma/prisma.service.ts`, `prisma/schema.prisma`, `.env.example` | Read-only local connection reports SSL=false and current role rolsuper=true. Pool limits/timeouts/TLS policy and separate migration/runtime roles are not specified for production. Both checked-in migrations are recorded finished; that alone does not prove full schema drift absence. | Verify private TLS connection, bounded pool, least-privilege runtime role and separately authorized migration role. Run non-destructive catalog/drift review in staging; use installed Prisma 6 migrate deploy, never migrate dev/reset. Medium; D/S: no change during audit, R/Sec: DB operations/permissions. |
| H10 | Dependency advisories; both `package.json` and `package-lock.json` | Registry audit: frontend 3 (2 high/1 moderate); backend 41 (1 critical/35 high/5 moderate). Backend omit-dev: 7 (1 critical/6 high), including argon2 -> node-pre-gyp -> tar and Prisma configuration dependencies. These are package-level counts, not independent remotely exploitable application flaws. | Triage reachability/install/build exposure, fix compatible patches first, review majors in isolation and rerun auth/build/browser tests. Do not use audit fix --force or automatically downgrade Prisma. Medium; D/S: none unless separate upgrade requires it, R/Sec: dependency changes. Details below. |
| H11 | Search/privacy delivery; `src/components/common/SEO/SEO.jsx`, `src/App.jsx`, `public/`; host configuration absent | VI/EN detail self-canonical/hreflang exists. SITE_URL is fixed to neotek.vn. Admin has no explicit route noindex; staging has no global noindex gate. No robots.txt/sitemap.xml found. CSR NotFound does not establish actual hosting HTTP 404. | Environment-aware verified public domain, explicit admin/staging robots policy, real-data sitemap and host-level status/redirect checks. Medium; D/S: none, R/Sec: metadata/host policy. No EN-to-VI canonicalization. |
| H12 | Unsafe production bootstrap/seed; Backend: `prisma/seed.ts`, `scripts/create-admin.ts`, import/population scripts | Seed upserts existing standard pages to DRAFT and overwrites title/SEO fields. Maintenance scripts and some test harnesses write data; they are not safe default production startup tasks. Admin bootstrap password is env-only and Argon2id hashed, a positive control. | Separate migrate deploy from seed/bootstrap; prohibit automatic seed/demo/import/cleanup on deploy. Review each apply action and target before execution. Small/medium; D: operations only if explicitly accepted, S: migrations separate, R/Sec: deployment safety. |

### MEDIUM

| ID | Component and files | Current behavior and risk | Recommended fix; complexity; impacts |
| --- | --- | --- | --- |
| M01 | Booking placeholder; `src/pages/booking/BookingPage.jsx`, `bookingData.js`, `src/App.jsx`, SEO route list | Public Booking uses mock busy events and React-local confirmed state; no real reservation persistence. Routes always exist, without feature flags. Users may believe they made a real booking. | Add explicit production-off flag across routes, navigation and CTA entry points; retain code; controlled direct-URL 404. Small/medium; D/S: none, R: visibility, Sec: none. |
| M02 | Locale scroll; `src/components/common/SmoothScroll/SmoothScroll.jsx`, `src/components/layout/NeotekNavbar/NeotekNavbar.jsx`, `src/i18n.js` | Pathname route synchronization scrolls to top on locale changes. Desired section/position preservation is absent and ordinary Back/Forward restoration may be affected. | Preserve same-page locale section anchor, fallback relative position after content/layout settles; retain normal-route navigation and browser restoration semantics. Medium; D/S: none, R: navigation, Sec: none. |
| M03 | Public/admin bundle boundary; `src/App.jsx`, `src/admin/app/AdminApp.jsx`, `vite.config.js` | AdminApp/AuthProvider eagerly enter public graph. Initial index JS 656.65KB / gzip 220.30KB; Vite warns >500KB. Detail editor 479.95KB / gzip150.72KB is already lazy; React shared chunk127.14KB. | Lazily load admin route/context and maintain existing Tiptap lazy boundary; measure network graph before further tuning. Medium; D/S: none, R: loading, Sec: none. No framework rewrite/manual chunk guesswork. |
| M04 | Security headers coverage; Backend: `src/main.ts`; static/proxy config absent | Helmet defaults provide API CSP/HSTS/frame/nosniff/referrer controls. Public HTML is served independently; its header coverage, Permissions-Policy and Cloudinary/font CSP allowances are unverified. | Inspect actual staging responses, define narrow public/API policies, test embeds/fonts/images and avoid blanket unsafe-inline allowances. Medium; D/S: none, R/Sec: browser policy. |
| M05 | Observability; Backend: `src/main.ts`, cache/auth logs; no monitoring deployment config | Nest logs exist but request correlation, 5xx/latency alerts, uptime/resource/DB/Redis/restart monitoring are not established. Some errors log raw dependency messages. | Minimal structured redacted logs, request IDs, uptime/readiness/latency/error/resource alerts; evaluate Sentry or equivalent with credential/PII scrubbing. Medium; D/S: none, R/Sec: diagnostics/privacy. |
| M06 | Redis cache/session memory; Backend: `docker-compose.yml`, `src/cache/cache.service.ts` | Auth/session and public cache share Redis; no maxmemory/eviction capacity policy. Session eviction causes logout; memory exhaustion can break authentication/cache. | Accept a no-eviction/session-safe capacity strategy, or isolated stores with explicit limits; load/recovery test. Medium; D: ephemeral sessions may be invalidated by operational change, S: none, R/Sec: session availability. |
| M07 | Unused dependency candidates; `package.json`, lockfile | No source/script references found for five FullCalendar packages, hookform resolvers, react-hook-form, react-query, date-fns, zod and Tiptap bubble-menu extension. FullCalendar React7 vs plugins6 is also inconsistent. Vite/plugin-react are used by build config and are NOT dead. | Confirm package/config reachability, remove only verified unused packages in accepted Phase B, rebuild/regress. Small; D/S: none, R: package graph, Sec: supply-chain reduction. |
| M08 | Staging/runtime delivery gate; missing production Docker/proxy/static-host configuration | No reproducible production deployment, non-root runtime, signal/health wiring, origin access restrictions or provider-specific staging validation exists. Existing dev watch/Vite processes are not production acceptance. | After runtime fixes, accept Node LTS compatible with lockfile/native Argon2, static frontend hosting and multi-stage backend strategy; then implement Phase D. Medium/large; D/S: none, R/Sec: deployment. No Dockerfiles in Phase A. |

### LOW

| ID | Component and files | Current behavior and risk | Recommended fix; complexity; impacts |
| --- | --- | --- | --- |
| L01 | Empty/dead-code candidates; `src/api/`, admin utility/config files | src/api is empty. Admin is already organized into app/pages/editors/shared/domain/config/utils/styles; no old CollectionEditors/EditorControls import tree found. PublicPreviewViews contains intentional lazy renderer boundaries, not useless re-export wrappers. No confirmed duplicate API service requiring replacement: public content and authenticated admin clients have different contracts. | Remove empty folder only after acceptance; keep meaningful boundaries. Review HTML-to-text helpers with different normalization contracts before consolidating. Small; D/S/R/Sec: none. |
| L02 | Styles/artifacts; `src/admin/styles/admin.css`, `admin-solution-detail.css`, `docs/*png` | Two admin CSS files, 21 repeated selector groups in main and one in detail file by structural scan; responsive/state repetitions are not proof of dead overrides. Fourteen tracked review PNGs were already deleted by user. | Manual selector/reachability review before removal; keep admin-scoped styles and user deletions. Small; D/S: none, R: only if later CSS cleanup, Sec: none. No CSS edits in audit. |
| L03 | Prisma configuration deprecation; Backend: `package.json` | Prisma6 validate warns package.json#prisma will be removed in Prisma7. Installed client/CLI are6.19.0; a compatible6.19.3 update is available. Major7 has separate configuration/runtime implications. | Schedule tested config migration separately; pin client/CLI parity and do not infer installed-version commands from newer documentation. Small/medium; D/S: none for config-only work, R: tooling, Sec: none. |
| L04 | Developer/runtime packaging; Backend: `.env.example`, `docker-compose.yml`, `tsconfig.json`, build scripts | DB example uses5432 but Compose maps5433. Backend source maps and seed/scripts compile into dist; frontend emits no map files by current default. Broader runtime packaging can include unnecessary tooling. | Fix example port, exclude operational tools from public/runtime artifacts only after build review; retain private server diagnostics if useful. Small; D/S: none, R: packaging, Sec: deployment surface. |

## URL/data inventory

- Canonical detail record: `nhan-su-tien-luong`, kind SOLUTION_DETAIL, PUBLISHED. VI `/solutions/nhan-su-tien-luong`; EN `/en/solutions/nhan-su-tien-luong`. Both module translations share the slug. Titles, descriptions, SEO and article remain localized.
- CRM, sales, purchasing, warehouse, logistics, production, maintenance, projects, finance and forecast currently have no module slug in either locale. Missing records/routes should remain unavailable rather than fabricate URLs.
- Verified stale linked alias: `/solutions/hr-payroll` and localized EN form. Proposed permanent redirect preserves locale, query handling and a single destination. `/solutions/hr-solution` is an unverified historical candidate, not an alias approved by this audit.
- Shared Trusted is verified in both Home/Solutions and VI/EN, preserving the same stored logo data. CTA and FAQ migration is pending; Footer CTA remains separate. The migration script has explicit dry-run/apply and conflict checks; neither mode was executed here.
- Public standard Draft delivery is directly observed; Solution Detail publication checks exist on both cache and DB paths. Shared source lookup rejects missing/nested references rather than creating hidden duplicates.

## Positive controls retained

Opaque random sessions are stored using hashed Redis keys; production cookie name uses __Host- prefix, HttpOnly, Secure when NODE_ENV=production, SameSite=Lax and an8-hour absolute TTL. Logout deletes session/CSRF state. Active-user/current-role checks and Argon2id hashing remain. CSRF creation is atomic and bounded to remaining session TTL; mutations/logout validate server token and Origin. Login rate limit fails closed on Redis rejection. CORS defaults to one exact configured origin, not a coded wildcard. Deployment must verify same-site frontend/API topology for SameSite cookies.

Typed strict Zod validation exists for editor payloads; article JSON uses allowed nodes/marks and safe URL checks rather than arbitrary HTML. Public/preview renderers are reused. Canonical shared-content infrastructure, bilingual editing, portrait dialog, Radix controls and semantic colors remain. Unsaved guard covers in-app navigation and browser events; regression passed mocked saves and validation failures. No source redesign occurred.

No WordPress runtime content adapter was found. Offline import scripts and migrated-content normalization intentionally retain WordPress migration terminology; they are maintenance tools, not a provider runtime to reintroduce.

Navbar uses viewport portal positioning to escape transformed smooth-scroll ancestors. Existing browser suite passed sticky/header/detail checks; no new sticky defect was found. Tablet/mobile reading disclosure and desktop reading rail remain unchanged.

## Dependency evidence

Safe `npm audit --json`, `npm audit --omit=dev --json` and `npm outdated --json` were run; no install/update/fix command ran. Counts reflect audit-time registry state and propagated package advisories.

| Repository | All dependencies | Omit-dev | Interpretation |
| --- | --- | --- | --- |
| Frontend | 2 high,1 moderate,0 critical | same3 | Vite/build packages are currently declared production dependencies; omit-dev does not imply deployed static JS exposes a dev server. |
| Backend | 1 critical,35 high,5 moderate | 1 critical,6 high | Significant tooling propagation; production/install chain still needs targeted triage. |

- Vite5.4.21: [Windows file-deny bypass](https://github.com/advisories/GHSA-fx2h-pf6j-xcff), [optimized-map traversal](https://github.com/advisories/GHSA-4w7w-66w2-5vf9), [Windows editor UNC exposure](https://github.com/advisories/GHSA-v6wh-96g9-6wx3). Never deploy the Vite development server. Suggested audit resolution crosses major versions; requires compatibility review.
- source-map-js: [indexed-map denial of service](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). esbuild: [development-server cross-origin exposure](https://github.com/advisories/GHSA-67mh-4wv8-2f99).
- Backend tar via argon2/node-pre-gyp: [unlimited decompression/parse denial of service](https://github.com/advisories/GHSA-23hp-3jrh-7fpw) plus extraction/path advisories. Application has no audited tar-upload endpoint; remote exploitability is not established. Audit recommends argon2 major upgrade, not an authorized automatic fix.
- Prisma configuration chain: [deepmerge-ts recursive stack DoS](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [Effect RPC context contamination](https://github.com/advisories/GHSA-38f7-945m-qr2g). Application does not explicitly expose Effect RPC. Do not blindly accept audit's suggested Prisma downgrade.
- Jest/tooling includes propagated braces/sprintf-js findings. Separate build/install tools from runtime attack paths before prioritization; no automatic Jest/Nest/React/Prisma major upgrade.

## Validation evidence and limitations

| Check | Result |
| --- | --- |
| Frontend `npm.cmd run lint` | PASS |
| Frontend `npm.cmd run build` | PASS; 8646 transformed modules; >500KB index warning remains |
| Existing `scripts/check-cms-routes.mjs` | PASS public/admin1440/1024/820 and detail VI/EN390; typing, Tiptap operations, upload mock, atomic save errors/undo, previews, TOC/SEO/related/final CTA. Runtime wrapper suppressed PNG writes; script unchanged. |
| Backend Prisma validate | PASS; Prisma7 config deprecation warning |
| Backend Jest `--runInBand` |20 suites passed,1 skipped;100 tests passed,1 skipped. Redis integration requires dedicated AUTH_REDIS_TEST_URL; not configured/run. |
| Backend lint | PASS using appended `--no-fix` to override script's write mode |
| Backend build | Isolated TypeScript compilation with project's `tsconfig.build.json` PASS; emitted src/main.js, no root main. Direct npm build was not completed because live watch dist must be preserved. Nest CLI isolation attempts did not provide a trustworthy emitted artifact; compiler result is the explicit substitute, not claimed full default-build acceptance. |
| Database/public read-only checks | Migration ledger2/2 finished; shared references/module slug inventory; SSL/role booleans; DRAFT Home/admin-test public GET200 confirmed |
| Browser limitations | Mocked API/auth/saves/Cloudinary; not proof of real production login/save/publish/upload, proxy redirects, outage/restart or staging headers. No DB data modified. |
| Git whitespace and scope | Run at audit completion in both repos. Backend expected clean; frontend only four new docs plus preserved14 screenshot deletions. |

Prisma schema syntax and an applied migration ledger do not establish full schema-drift absence. No shadow database, live migration, restore drill, production load test, internet port scan or production deployment was performed.

## A–Z requested status

| Area | Audit status |
| --- | --- |
| A frontend cleanup | Empty API folder/unused packages/style candidates identified; no cleanup yet. |
| B backend cleanup | Entry-point/tooling issues identified; no cleanup yet. |
| C canonical slug | One HR shared slug verified;10 modules unconfigured. |
| D VI/EN routes | Canonical HR routes/browser regression pass; locale scroll does not preserve position. |
| E legacy redirects | hr-payroll linked and unresolved; hr-solution unverified. |
| F Booking | Public mock/local-state feature; production-off gate missing. |
| G public Login | NOT IMPLEMENTED / PLACEHOLDER; password logging blocker. |
| H locale scroll | Resets on pathname change; improvement pending. |
| I frontend runtime | Static Vite build works; API localhost fallback and eager admin remain. |
| J backend runtime | Compiler passes; readiness/shutdown/env outage work remains. |
| K start:prod | Incorrect entry point; blocker. |
| L security | Session/roles/strict article controls present; FAQ HTML and release gates unresolved. |
| M CSRF/CORS/Origin | Mutation/logout protections present; login Origin and prod URL validation need work. |
| N cookies/session | Secure production policy exists; same-site topology/isolated Redis integration pending. |
| O DDoS/WAF | Edge/proxy controls proposed, not deployed/verified. |
| P PostgreSQL | Local non-TLS superuser; production policy unverified. |
| Q Prisma | Validate/pass;2 applied migrations; full drift unverified; deploy-only policy required. |
| R Redis | Dev exposed-port/no-auth config; bounded failure/memory policy missing. |
| S Cloudinary | Signed flow/client checks pass mocked regression; actual preset/quota/live upload unverified. |
| T Docker | No production Dockerfiles created; Phase D gated. |
| U reverse proxy | Required proposal; no verified config. |
| V backup/restore | Proposed drill only; release blocked without evidence. |
| W monitoring | Minimal Nest logs; production alerting unverified. |
| X SEO | Detail canonical/hreflang pass; admin/staging/sitemap/host404 gaps. |
| Y bundles | Admin eager; Tiptap lazy; measured warning documented. |
| Z staging readiness | NOT READY; release gates and real integration checks remain. |

## Recommended order and Phase B boundary

1. Accept audit. Resolve public draft semantics and intended Home/Solutions publication, FAQ sanitization policy and customer-auth placeholder exposure first.
2. In accepted Phase B, small non-data fixes: remove credential logs, correct production entry command, validate env, gate Booking/customer auth plus links, reuse verified path builder/legacy alias, admin/staging robots, bounded parser configuration and graceful shutdown. Add focused regression tests before changing public contracts.
3. Review shared CTA/FAQ differences and dry-run output before explicitly approved data-reference changes. No schema migration is required by the identified source fixes; publication/content normalization can still change business visibility/data.
4. Triage dependency updates in compatible increments; major upgrades/config transitions need acceptance. Lazy admin and locale scroll changes require existing browser coverage.
5. Phase C: bounded Redis/health, quotas/proxy policy, structured observability, least-privilege/TLS and private-network decisions. Provider selection, operational session changes, API behavior changes and destructive work are separately gated.
6. Phase D only after runtime is stable: deterministic production build/container/static delivery, staging checks, backup/restore drill, then production gate and rollback evidence.

Likely future frontend files: App.jsx, config/api.js, pages/auth/*, booking routes, navbar, SmoothScroll, SEO, solutionPresentation/preview route helpers, FAQ rendering, package manifests and public robots/sitemap generation. Likely backend files: package manifests, main.ts, pages.service.ts/tests, health/cache/auth/media boundaries, validation registry, env example and eventually deployment config. These are proposals, not changes made here.

Safe candidates require no additional architectural/destructive approval **after the Phase A acceptance gate**. Risky items require explicit acceptance: persisted publication/content edits, shared-content apply, major dependency upgrades, sanitization of existing values, network/provider policy, session-store changes, production infrastructure, migration/restore operations. No automatic continuation to Phase B.


## Post-UX Delta Audit

Baseline retained above. Compared frontend Phase A checkpoint 2cfa8212 with current checkpoint 8cda151f; backend remains 5d51166 before Phase B edits. Both working trees were clean at entry. Rechecked SolutionDetailEditor, ArticleEditor, CmsTutorial, their scoped styles, SolutionDetailPage/styles and the article renderer contract. The current TOC and Featured rail are two visible sections, not tabs; no rail redesign or CSS changes were made. The regression suite's obsolete tab assertions were corrected to match this checkpoint.

The existing browser suite passed VI/EN public/admin at1440/1024/820/390, independent locale drafts, metadata/SEO fallback, save/discard, failed save/undo, slash commands, Inspector, block operations, saved preview, heading anchors/active TOC, published discovery, related content and shared footer. Tests mock authentication, saves and Cloudinary; they do not prove live uploads or hosting HTTP semantics. Phase B adds feature/route/scroll/network-graph checks. No new source blocker was found in the final article architecture; the Phase A standard-page draft exposure remained and is fixed below. Fourteen screenshot deletions already in the checkpoint remain intact.

## Phase B Resolution

Safe source fixes only. No schema/database/content migration, seed, Docker, WAF, infrastructure, restore or deployment work. No commit/push. Production deployment remains unapproved.

| Original finding | Status | Phase B evidence / remaining responsibility |
| --- | --- | --- |
| B01 | RESOLVED | All public DB paths require PUBLISHED; every Redis hit rechecks current DB status. Draft/archived/missing normal and detail records are tested, including stale cache. Authorized admin draft access is unchanged. Standard frontend views also render the existing public404 on API404, including after a previously loaded locale. Existing Draft Home/Solutions were not published. |
| B02 | RESOLVED | Real isolated default Nest builds emitted dist/src/main.js, no dist/main.js. start:prod now runs node dist/src/main.js. The npm production command bound temporary port59451 and returned health200 with database/cache up; existing watch process was untouched. |
| B03 | RESOLVED | Removed public form payload/password logs. Central publicAuth=false hides actions and removes public login/register routes; direct paths use public404. No admin-login fallback or auth replacement. |
| B04 | RESOLVED | One public backend FAQ sanitizer, sanitize-html2.18.0, allowlists formatting/links and removes scripts/events/unsafe schemes/embeds. Fresh and old cached FAQ responses are sanitized; stored/admin data is untouched. Tests use the real sanitizer. |
| B05 | DEFERRED TO PHASE C | Private DB/Redis transport/auth/ACL policy not provisioned or verified; development Compose unchanged. |
| B06 | DEFERRED TO PHASE D | Backup automation and isolated restore evidence remain a release blocker. |
| H01 | PARTIALLY RESOLVED | Frontend production API build gate and small backend production URL/port/media completeness checks implemented. Explicit production mode, private endpoints, TLS and secret injection remain operational gates. |
| H02 | DEFERRED TO PHASE C | Redis deadlines/retry/offline and isolated outage/recovery policy unchanged. |
| H03 | DEFERRED TO PHASE C | Readiness failure status/deadlines and graceful signal draining remain unverified. Healthy temporary production start is not outage/shutdown acceptance. |
| H04 | DEFERRED TO PHASE C | Proxy trust, account/media quotas and WAF/origin policy unchanged. |
| H05 | PARTIALLY RESOLVED | Canonical locale/shared-slug helper reused; verified hr-payroll alias redirects with replace while preserving locale/query/hash. No hr-solution source evidence, so no invented alias. Host-level permanent redirects belong to Phase D; ten modules still need business-approved slugs/data. |
| H06 | DEFERRED TO PHASE C | Shared Trusted implementation preserved. CTA/FAQ inline copies and separate Footer CTA preserved; shared-content DB migration requires separate explicit approval and was not run. |
| H07 | DEFERRED TO PHASE C | Login Origin/input-size/body-parser policy unchanged; existing auth/CSRF/Origin regression retained. |
| H08 | DEFERRED TO PHASE C | Cloudinary preset/quota/live-upload policy not verified; existing signed flow preserved. |
| H09 | DEFERRED TO PHASE C | DB least privilege/TLS/pool/production drift policy not changed. |
| H10 | DEFERRED TO PHASE C | Existing41 backend advisories remain; no automatic major upgrades. Only sanitizer/types added. Jest transforms the parser's ESM dependencies without mocking security behavior. |
| H11 | PARTIALLY RESOLVED | Admin routes explicitly noindex/nofollow; detail canonicals/hreflang preserved. Staging/domain/sitemap/robots and host HTTP404/permanent redirects remain Phase D. |
| H12 | DEFERRED TO PHASE D | No seed/import/bootstrap/migration was run. Deployment must prohibit automatic content resets and separate reviewed operational commands. |

Additional accepted source fixes: M01 booking defaults off via VITE_FEATURE_BOOKING; disabled links/routes and normal-navigation chunk loading are checked. M02 locale switching carries active-H2 index/offset where available, otherwise relative scroll ratio, across VI/EN; short layout observation handles localized content, stops on user interaction, and POP navigation is left to browser restoration. M03 AdminApp plus AuthProvider now load only on admin routes; Tiptap remains lazy. No vendor strategy was added. Other Phase A medium/low findings remain unchanged unless explicitly noted in environment docs.

### Source behavior and validation

- Publication smoke against the isolated production process: home404, solutions404, admin-test404, unknown404, published nhan-su-tien-luong200. Database content unchanged. Browser standard-page fixtures are explicitly PUBLISHED only in memory.
- Legacy aliases are client-side controlled redirects, not a claim of deployed HTTP301. Canonical HR path uses the same Vietnamese slug in both locales. Manager/editor paths remain admin paths; only public destinations use buildSolutionDetailPath.
- FAQ allowlist preserves p/br/div/strong/b/em/i/ul/ol/li/a; link attributes href/title and HTTP(S)/mailto/tel/relative URLs. Protocol-relative URLs and embedded content are excluded. Sanitization is separate from deferred shared-content migration. Maintainer policy: https://github.com/apostrophecms/apostrophe/tree/main/packages/sanitize-html#readme
- Frontend lint PASS; production build PASS with explicit /api; production-base rejection tests PASS for missing/localhost/unsafe schemes. No password/form logger remains in public auth source. Final browser suite PASS at1440/1024/820/390, including Draft/Archived Home/Solutions404 in VI/EN, unpublishing during locale switching, disabled routes/noindex/no chunks/no public auth requests, constructor/unknown slugs, legacy aliases, VI-to-EN and EN-to-VI H2/relative scroll, native restoration mode and existing admin/editor regressions.
- Backend Prisma validate PASS (existing Prisma7 config deprecation); Jest22 suites/125 tests PASS, one isolated Redis integration suite/test skipped because AUTH_REDIS_TEST_URL is not configured; backend lint PASS. Real isolated npm run build and npm run start:prod PASS. No developer dist was deleted/replaced by the isolated build.

| JS boundary | Before Phase B (post-UX) | After Phase B |
| --- | --- | --- |
| Initial index |664.57KB / gzip220.34KB |413.69KB / gzip143.93KB |
| AdminApp |Eager inside public entry |135.81KB / gzip41.21KB, lazy |
| SolutionDetailEditor/Tiptap |488.10KB / gzip152.51KB, lazy |486.77KB / gzip152.63KB, lazy |
| React shared |127.14KB / gzip41.56KB |127.14KB / gzip41.56KB |

Before sizes were measured by a real isolated build of checkpoint8cda151f with the same explicit /api base; after sizes come from the final production build. Temporary checkpoint/build files were removed. Chunk sizes reflect current build configuration, not total page download size. Disabled feature chunks may still be emitted as build artifacts but must not be requested through default public navigation. No warning-threshold tuning was performed.

### Exact Phase B changed-file manifest

Neotek Frontend (27 files):

- `.env.example`
- `docs/ENVIRONMENT_REFERENCE.md`
- `docs/PRODUCTION_READINESS_AUDIT.md`
- `scripts/check-cms-routes.mjs`
- `src/App.jsx`
- `src/admin/app/AdminApp.jsx`
- `src/admin/editors/solution-detail/SolutionDetailEditor.jsx`
- `src/components/common/NeotekButton/NeotekButton.jsx`
- `src/components/common/SmoothScroll/SmoothScroll.jsx`
- `src/components/home/HeroCarousel/HomeHeroView.jsx`
- `src/components/layout/NeotekFooter/NeotekFooter.jsx`
- `src/components/layout/NeotekNavbar/NeotekNavbar.jsx`
- `src/components/sections/FAQSection/FAQSection.jsx`
- `src/config/api.js`
- `src/config/features.js`
- `src/config/solutionRoutes.js`
- `src/i18n.js`
- `src/pages/auth/Login.jsx`
- `src/pages/auth/Register.jsx`
- `src/pages/home/HomePage.jsx`
- `src/pages/solutions/SolutionArticleView.jsx`
- `src/pages/solutions/SolutionDetailPage.jsx`
- `src/pages/solutions/SolutionsHeroView.jsx`
- `src/pages/solutions/SolutionsPage.jsx`
- `src/pages/solutions/solutionPresentation.js`
- `src/services/content/adapters/backendApiAdapter.js`
- `vite.config.js`

Neotek Backend (12 files):

- `.env.example`
- `jest.config.cjs`
- `package-lock.json`
- `package.json`
- `src/config/validate-environment.spec.ts`
- `src/config/validate-environment.ts`
- `src/main.ts`
- `src/pages/pages.service.spec.ts`
- `src/pages/pages.service.ts`
- `src/pages/public-html.spec.ts`
- `src/pages/public-html.ts`
- `src/sections/shared-content.spec.ts`


### Phase B exit gate

Completed2026-10-09 (Asia/Saigon). B01-B04 source blockers resolved; all required source validations PASS. Frontend lint/build and both git diff checks PASS. Backend Prisma validate, full Jest22 suites/125 tests (one isolated Redis integration suite/test skipped), lint, real isolated Nest build and npm production-start/healthy-port check PASS. The final full browser suite PASS includes publication/feature/alias/locale checks plus existing public/admin regressions; API writes/auth/Cloudinary remain mocked and all fixture reads are read-only. No screenshot artifacts were regenerated. No new source BLOCKER was identified.

The production build used explicit VITE_API_BASE_URL=/api; deployment must supply a same-origin API proxy or an explicitly configured HTTPS API base. Real development Home/Solutions remain DRAFT and intentionally return public404; publication is an existing admin/business operation, not a data change performed here. Shared Trusted is unchanged; CTA/FAQ migration and separate Footer CTA are untouched.

STOPPED AFTER PHASE B. Infrastructure B05/B06 and other Phase C/D gates remain; this is not production deployment approval. No commit, push, seed, migration, restore or deployment was performed.


## Phase C — Security & Runtime Hardening

Delta against the completed Phase B source baseline,2026-10-09. Both repositories were clean at entry. This pass does not repeat Phase A or change CMS/auth architecture, public business content, schema or persisted publication state. No commit/push/deploy/production infrastructure/Docker/staging/seed/shared-content migration. Temporary runtime builds preserve developer backend dist. Phase C source acceptance is separate from production readiness.

### Delta findings: evidence, fixes, files and validation

Paths below are backend-relative unless explicitly frontend. Every source change has a regression or runtime check; policy-only findings remain Phase D.

| ID/severity | Evidence at Phase C entry | Fix / changed files | Validation / current status |
| --- | --- | --- | --- |
| C01 HIGH | Production mode could be omitted; PORT optional; no safe proxy policy; HTTPS same-site origin not enforced. | package.json start:prod explicitly requires production; config/validate-environment.ts checks PORT, exact HTTPS origin, explicit IP/CIDR TRUST_PROXY and critical DB/Redis/media completeness; main.ts emits key-only configuration errors. .env.example documents trust. | Missing keys/bad port/mode/proxy/wildcard/path/partial media tests; real missing-mode start rejection. RESOLVED source; provider TLS/private credentials Phase D. |
| C02 HIGH | Express did not trust verified proxy peers; login IP limits could collapse behind proxy. | config/http-security.ts configures explicit addresses, no arbitrary hop count/true; config validator rejects wildcard and /0. | Local proxy chain contract reviewed; exact-address policy tests. RESOLVED source; real edge/header spoof/HTTPS detection Phase D. |
| C03 HIGH | Logout cleared only Path; nonproduction cookies could be insecure beyond localhost; malformed cookie accepted into datastore lookup. | auth/auth.controller.ts matches logout cookie flags and permits insecure only local HTTP; auth/session-auth.guard.ts validates43-character base64url token. | Production/dev/nonlocal flags, TTL, logout/revocation, malformed cookie401 tested. RESOLVED. |
| C04 HIGH | Login lacked Origin guard and email/unknown-field bounds. | auth/auth.controller.ts adds exact Origin,254-char email and strict keys; password12-256 retained. | Real HTTP evil/missing-origin rejection; controller bounds checked; no auth substitution. RESOLVED. |
| C05 HIGH | Redis had unbounded startup/offline/command waits and raw error logging. | cache/cache.service.ts connect2s/startup3s/command2s/quit2s, offline queue off, queue100, capped reconnect delay, destroy stalled socket without replay; config/deadline.ts shared deadline. | Fake-timer startup/command/close/recovery tests; real isolated process against unreachable Redis starts degraded, health503, public DB fallback, auth500/login503 and shutdown verified. RESOLVED source; actual recovery/capacity soak Phase D. |
| C06 HIGH | Health200 even on dependency failure; no deadline or shutdown hooks. | health/health.controller.ts live/ready plus legacy combined-ready alias; main.ts shutdown hooks and drain; config/http-security.ts rejects new work while draining. | HTTP DB/Redis503 and live200, real healthy ports, real Nest SIGTERM/SIGINT handlers complete Prisma/Redis close and port closes. RESOLVED source; native Linux delivery/in-flight soak Phase D. |
| C07 HIGH | Nest default parser preceded manual limit; recursive article validation could exhaust stack. | main.ts bodyParser:false; config/http-security.ts JSON2MiB/form64KiB/100 parameters; sections/validation/solution-detail.schemas.ts iterative32-level/50000-value guard; registry/admin service call it before Zod. | Real HTTP malformed JSON400/oversize413; nested article400 before DB writes; valid existing article/browser passes. RESOLVED. |
| C08 MEDIUM | Raw datastore errors in auth/cache/public/invalidation logs; no correlation/no-store umbrella. | config/http-security.ts exception filter/status-safe errors and generated request IDs/route/status/duration/no-store; runtime-logger.ts scrubs dependency errors/stacks; auth/cache/pages logs remove raw messages. | HTTP injected secret/path/stack error safe500; fatal/startup secret test; auth/admin no-store; source logging inventory. RESOLVED source; monitoring/private diagnostics Phase D. |
| C09 HIGH | Missing per-account/media/admin mutation/CSRF rates. | auth/login-rate-limit.guard.ts20/account/minute plus existing5/IP; auth/admin-rate-limit.guard.ts media20/user/minute, CSRF120, mutations120; controller/module wiring retained auth/roles/CSRF/Origin. | Account/media429 (including case/trailing-slash route variants), Redis503, real app DI graph, media auth/CSRF/Origin HTTP regressions. RESOLVED source; WAF/cost quotas Phase D. |
| C10 MEDIUM | Helmet API defaults were not a deliberate JSON policy; no Permissions-Policy. | config/http-security.ts API default-src/frame-ancestors/base-uri/form-action/object-src none, no unsafe-inline, HSTS/nosniff/referrer/Permissions-Policy. | HTTP headers verified. RESOLVED API; separately hosted HTML/admin CSP remains Phase D with explicit staged policy and inline-style rationale. |
| C11 HIGH | Standard media string fields accepted unsafe schemes; legacy values could reach public renderers. | sections/validation/content-urls.ts permits HTTPS/project paths/inert legacy attachment IDs; ordinary image fields validate at writes; pages.service.ts filters unsafe legacy media/URLs in fresh/cache responses without DB changes. | javascript/vbscript/data/protocol-relative/backslash tests; geometry/Cloudinary/legacy compatibility; complete editor/browser suite. RESOLVED. Article structured JSON remains its existing allowlist renderer, not an extra HTML sanitizer. |
| C12 HIGH | Unsafe rich-content regression needed after runtime changes. | Existing real backend FAQ HTML sanitizer retained; only public dangerouslySetInnerHTML is FAQ. Structured article renderer uses allowed nodes/marks/safe URLs; CTA plain text escaped. | Real sanitizer script/event/iframe/style/unsafe-scheme tests; structured schema tests; complete public/admin browser pass. RESOLVED. |
| C13 MEDIUM | Fatal process behavior and explicit frontend map policy unrecorded. | main.ts fatal exceptions/rejections terminate nonzero without secrets; frontend vite.config.js explicitly sourcemap:false. | Isolated FATAL/REJECTION tests and zero dist .map files; frontend src contains no console logging. RESOLVED source; supervisor/static packaging Phase D. |
| C14 HIGH | Backend41 advisories and frontend3 at entry. | Frontend source-map-js1.2.1 ->1.2.2 compatible patch in lockfile; package engines retain Node22 minimum compatibility in both repositories. No major upgrade/force/downgrade. | Frontend lint/build/browser pass; final front2 (high1/moderate1), backend41 unchanged (critical1/high35/moderate5); backend omit-dev7 (critical1/high6). PARTIALLY RESOLVED; explained upgrade/provenance gate Phase D. |
| C15 LOW | Prisma6 package seed config warns about Prisma7 removal. | Evaluated and retained existing6.19.0 client/CLI/seed contract; config migration is optional operational tooling change, not necessary security fix. | Prisma validate passes; no seed executed. DEFERRED TO PHASE D / separately approved tooling update; no major7. |

### Security contracts preserved and checked

- Opaque sessions remain32 random bytes, hash-only Redis key identity, fresh login token,8-hour absolute expiry, no sliding refresh. AuthService rechecks active user/current role from DB; malformed/expired session401, storage failure500. Logout revokes session plus CSRF keys. Dedicated real Redis integration remains opt-in and skipped without AUTH_REDIS_TEST_URL; HTTP fixture tests prove contract without real-account writes.
- CSRF cannot replace authentication. Missing/invalid token403; logout/admin/media writes still require session, server-scoped matching CSRF and exact Origin. Atomic session-CSRF acquisition/expiry unchanged. CSRF storage failure500 preserves frontend session semantics. All actual backend controllers inventoried: AuthController, AdminController, MediaController, PagesController, HealthController; Users/Sections modules expose no extra unguarded HTTP controllers.
- ADMIN vs EDITOR business policy unchanged: authenticated ADMIN/EDITOR edit content, existing ADMIN-only structural operations remain ADMIN-only. No complex RBAC, new users or customer auth. Direct unauthenticated admin/media access401; changed current role affects next request. Existing publish/shared-content policy was not guessed or expanded.
- Exact single-origin credentialed CORS, safe OPTIONS and login/write Origin remain consistent. Rejecting Origin is distinct from CORS hiding a response; tests exercise server-side denial. Same-site HTTPS remains required for SameSite=Lax.
- Strict Zod/manual endpoint DTO validation remains authoritative. No global ValidationPipe was installed because plain TypeScript DTOs without class-validator metadata would create misleading/breaking whitelist/coercion behavior. Existing schemas reject unknown article/editor keys and validate node/mark/link/image shapes. Login explicitly rejects unknown fields; public slug max120 with kebab syntax and locale vi/en prevents arbitrary cache-key segments.
- Cache keys stay cms:page:<slug>:<locale>; no auth-key scanning/blanket flushing. Every hit rechecks PUBLISHED against DB; disabled/unpublished detail and publication transitions remain tested. Public FAQ/media boundary also protects older cache data. Shared Trusted canonical consumers/cache invalidation remain covered; CTA/FAQ inline data and separate Footer CTA unchanged. No shared migration ran.
- Cloudinary API secret remains server-only; client cannot choose arbitrary signed parameters; fixed image resource path, formats, unique neotek/cms IDs, overwrite=false and preset remain. New signing rate is20/user/minute. Client10MB and secure Cloudinary response checks remain; actual signed-preset enforcement/quotas/live upload are unverified provider gates.

## Phase C Resolution

Historical Phase A/B rows above are retained. This table is the current status for every original finding. RESOLVED means the finding's authorized source correction/verification is complete; a row explicitly identifying infrastructure verification cannot be interpreted as production approval.

| Finding / original severity | Current status | Evidence / remaining responsibility |
| --- | --- | --- |
| B01 BLOCKER | RESOLVED | PUBLISHED-only DB/cache guards preserved; draft/archive/browser and current publication-aware live checks. No DB publication changed here. |
| B02 BLOCKER | RESOLVED | Real isolated default Nest build/start; explicit production-mode gate; compiled dist/src/main.js. |
| B03 BLOCKER | RESOLVED | Public auth/Booking remain gated; no password/form logs; admin auth isolated. |
| B04 BLOCKER | RESOLVED | One trusted FAQ sanitizer and real malicious HTML regression; structured article separately safe. |
| B05 BLOCKER | DEFERRED TO PHASE D | Private/authenticated/TLS DB/Redis and origin network restrictions documented; dev Compose not promoted. |
| B06 BLOCKER | DEFERRED TO PHASE D | Backup automation and isolated restore proof required before release. |
| H01 HIGH | PARTIALLY RESOLVED | Source production mode/port/origin/proxy/dependency/media gates done; deployed secrets/private/TLS and patched runtime require Phase D proof. |
| H02 HIGH | PARTIALLY RESOLVED | Source deadlines/offline/retry/fail-closed complete; live unreachable-Redis and unit reconnect pass; real recovery/soak/capacity proof Phase D. |
| H03 HIGH | PARTIALLY RESOLVED | Ready503/live200/deadlines/drain/hooks tested, including real Nest handlers on Windows; native Linux/container delivery/in-flight drain Phase D. |
| H04 HIGH | PARTIALLY RESOLVED | Explicit proxy trust, account/IP/media/mutation/CSRF quotas done; actual forwarded chain/private origin/WAF Phase D. |
| H05 HIGH | PARTIALLY RESOLVED | Canonical/legacy client redirects retained; hosting permanent redirects and separately approved missing business slugs remain Phase D/data approval. |
| H06 HIGH | DEFERRED TO PHASE D | Shared Trusted canonical preserved; CTA/FAQ migration remains separately approval-gated and was not run. Footer CTA distinct. |
| H07 HIGH | RESOLVED | Exact login Origin/strict bounded login, effective parser limits, standard copy/media bounds and recursive complexity400 regression. |
| H08 HIGH | PARTIALLY RESOLVED | Signing auth/CSRF/Origin/parameters/rate checks done; actual preset10MB/quota/permissions/live upload Phase D. |
| H09 HIGH | DEFERRED TO PHASE D | Least privilege/private TLS/pool/drift policy documented; no DB/schema/credential changes here. |
| H10 HIGH | PARTIALLY RESOLVED | Safe source-map-js patch; remaining tar native-install critical and Prisma/Jest/Vite tooling advisories explicitly explained below; approved breaking updates/install provenance Phase D. |
| H11 HIGH | PARTIALLY RESOLVED | Admin noindex retained/browser verified; staging/domain/robots/sitemap/host404/CSP delivery Phase D. |
| H12 HIGH | DEFERRED TO PHASE D | No seed/import/bootstrap/maintenance apply ran; deployment prohibition and reviewed migrate deploy gate documented. |
| M01 MEDIUM | RESOLVED | Booking default-off flag/links/direct404 browser retained. |
| M02 MEDIUM | RESOLVED | VI/EN section/relative reading position and normal navigation regression retained. |
| M03 MEDIUM | RESOLVED | Admin/Tiptap lazy boundaries retained; final initial413.69KB/gzip143.93KB, AdminApp135.81KB/gzip41.21KB lazy. |
| M04 MEDIUM | PARTIALLY RESOLVED | Strict API CSP/headers verified; actual public/admin HTML headers/report-only-to-enforced CSP Phase D. |
| M05 MEDIUM | PARTIALLY RESOLVED | Request IDs/status/duration/redacted errors/logs done; monitoring/alerts/private diagnostics Phase D. |
| M06 MEDIUM | DEFERRED TO PHASE D | Combined session/cache Redis noeviction/capacity/durability/alerts requirement; no store architecture change. |
| M07 MEDIUM | DEFERRED TO PHASE D | Unused dependency removal is outside this security pass; do only separately reviewed cleanup, not blind deletions. |
| M08 MEDIUM | DEFERRED TO PHASE D | Docker/static hosting/staging/supervisor/private-origin validation intentionally not started. |
| L01 LOW | DEFERRED TO PHASE D | Optional empty/dead-code candidates outside scope; no confirmed duplicate replacement needed. |
| L02 LOW | DEFERRED TO PHASE D | CSS/source redesign outside scope; user screenshot deletions stay intact. |
| L03 LOW | DEFERRED TO PHASE D | Prisma6 package seed deprecation retained intentionally; no operational seed run or Prisma7. |
| L04 LOW | PARTIALLY RESOLVED | Dev port5433 already fixed, frontend maps explicitly off; private backend/tool/map packaging Phase D. |

### Dependency triage and remaining severities

Final npm registry audit (2026-10-09): frontend critical0/high1/moderate1/low0, source-map-js1.2.2 fixed; backend critical1/high35/moderate5/low0, omit-dev critical1/high6/moderate0/low0. Counts include propagated advisories and do not equal independent internet exploits.

- Critical tar via argon20.31.2 -> @mapbox/node-pre-gyp1.0.11 -> tar6.2.1 is native-package installation/extraction exposure. Application has no archive upload/extraction HTTP path; Cloudinary signs images directly. This is a concrete supply-chain/build risk, not dismissed as harmless. Fix recommendations require an Argon2 breaking upgrade or incompatible tar override, prohibited for this pass. Phase D must use trusted artifacts/restricted builders, not untrusted archives, and separately review upgrade/compatibility before release. No critical advisory is left unexplained. Advisory examples: https://github.com/advisories/GHSA-34x7-hfp2-rc4v and https://github.com/advisories/GHSA-23hp-3jrh-7fpw .
- Backend high chains through Prisma config deepmerge-ts/Effect and Jest/braces remain build/config/tool exposure; no application Effect RPC endpoint. Audit suggests Prisma downgrade/Jest major/Argon2 breaking upgrade, not a safe blanket fix. No --force or framework major upgrade ran. Stage approved changes separately and rerun native auth/test/build compatibility.
- Frontend Vite5/esbuild remaining high/moderate findings affect development servers/tooling. Static deployment must exclude Vite dev/preview; local servers must remain trusted/private. Upgrading Vite/esbuild crosses major versions; Phase D review required. source-map-js compatible patch was applied and all frontend checks pass. See existing advisory links above.
- Node22 remains the compatible supported major; engines >=22.12.0 <23 is a compatibility floor, not a security-patch recommendation. Actual local22.12.0 is old; Phase D must select/pin current patched22.x and validate native Argon2, satisfying eslint's22.13+ constraint. Official support schedule: https://github.com/nodejs/Release . No system runtime major was changed.

Remaining source-level security BLOCKER:0. Original operational release BLOCKERs:2 (B05 private infrastructure, B06 recovery). HIGH findings still awaiting Phase D/business/integration proof:H01-H06,H08-H12 (11 partially/deferred rows); H07 resolved. MEDIUM remaining:M04-M08 (5). LOW remaining:L01-L04 (4). Dependency package critical1 is explicitly explained and remains a release/install-provenance gate, not claimed fixed. These counts describe original audit finding rows, separate from npm advisories.

### Validation and manual-check evidence

- Frontend full lint PASS; explicit /api production build PASS; zero public .map files. No UI/CSS/editor change. Full browser suite PASS public/admin VI/EN1440/1024/820/390: publication transitions/direct drafts/archives, feature gates, alias/canonical/scroll, lazy admin, shared Trusted, article rail/Inspector/Tiptap/save/failure/undo/preview/related/final CTA. Auth/saves/Cloudinary are mocked; DB fixture reads only; no PNG artifacts regenerated.
- Backend Prisma validate PASS; existing Prisma7 config deprecation remains. Full Jest25 suites/152 tests PASS,1 isolated Redis suite/test skipped because AUTH_REDIS_TEST_URL is not configured. HTTP fixture security checks cover production/dev cookies/logout, Origin/preflight, auth/CSRF/roles, media429, body400/413, safe500, DB/Redis readiness503 and drain. Unit tests cover real sanitization, unsafe media, recursive400, absolute/current-role session behavior and bounded Redis/reconnect/close.
- Backend lint PASS with --no-fix; real isolated default npm build/start:prod PASS. Runtime harness rejects missing production mode, verifies healthy/live/readiness, direct auth/admin401, evil login Origin403 and publication according to current read-only DB state. It checks Nest SIGTERM/SIGINT handlers, Redis/Prisma close and closed port, fatal/rejection nonzero redacted exit, unavailable Redis degraded readiness503/public DB fallback/auth500/login503, and required DB unavailable startup nonzero/bounded/redacted.
- Windows signal test emits events into the real Nest handlers, because native kill on Windows forcibly terminates. Native Linux/container signal forwarding and realistic in-flight drain/recovery soak explicitly remain Phase D. No actual Cloudinary upload/account policy or deployed WAF/private network/public HTML CSP/backup restore was tested.
- Live production smoke uses existing development DB/Redis solely for read-only DB queries and ordinary public-cache operations. Session login/logout/security mutation tests use isolated dependency fixtures, not real accounts. No schema/data/reset/publish/shared migration executed. All temporary child processes/artifacts are owned and removed; original backend dist preserved.
- Both repository git diff whitespace checks PASS at completion. Exact manifest below records only Phase C changes from clean entry.

### Phase C exit gate

Authorized source corrections complete; no unresolved source security blocker. Production start, cookie/session/CSRF/Origin protections, controlled exceptions, bounded health/failure behavior and real Nest shutdown handlers verified. No critical dependency left unexplained. Phase D infrastructure/proxy/WAF/TLS/provider/backup/native-signal/deployment requirements documented in the existing runbook and environment reference.

This is NOT production-ready or deployment approval. Phase D remains required; no automatic continuation. Shared-content migration and business data approvals remain separate. No commit/push/deploy/Docker/staging work performed.


### Exact Phase C changed-file manifest

Neotek Frontend (6 files):

- `docs/DEPLOYMENT_RUNBOOK.md`
- `docs/ENVIRONMENT_REFERENCE.md`
- `docs/PRODUCTION_READINESS_AUDIT.md`
- `package-lock.json`
- `package.json`
- `vite.config.js`

Neotek Backend (37 files):

- `.env.example`
- `package-lock.json`
- `package.json`
- `src/admin/admin.controller.ts`
- `src/admin/admin.service.ts`
- `src/admin/solution-detail.spec.ts`
- `src/app.module.spec.ts`
- `src/auth/auth.controller.spec.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.module.ts`
- `src/auth/auth.service.spec.ts`
- `src/auth/auth.service.ts`
- `src/auth/login-rate-limit.guard.spec.ts`
- `src/auth/login-rate-limit.guard.ts`
- `src/auth/session-auth.guard.ts`
- `src/cache/cache.service.ts`
- `src/cache/page-cache-invalidation.service.ts`
- `src/config/validate-environment.spec.ts`
- `src/config/validate-environment.ts`
- `src/health/health.controller.ts`
- `src/main.ts`
- `src/media/media.controller.spec.ts`
- `src/media/media.controller.ts`
- `src/media/media.module.ts`
- `src/pages/pages.controller.ts`
- `src/pages/pages.service.ts`
- `src/sections/validation/section-content.registry.ts`
- `src/sections/validation/solution-detail.schemas.ts`
- `scripts/check-runtime-hardening.cjs` (new)
- `src/auth/admin-rate-limit.guard.ts` (new)
- `src/cache/cache.service.spec.ts` (new)
- `src/config/deadline.ts` (new)
- `src/config/http-security.spec.ts` (new)
- `src/config/http-security.ts` (new)
- `src/config/runtime-logger.ts` (new)
- `src/sections/validation/content-urls.spec.ts` (new)
- `src/sections/validation/content-urls.ts` (new)
