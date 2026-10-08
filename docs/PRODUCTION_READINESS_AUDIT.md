# Production readiness audit — Phase A

Audit date: 2026-10-08. **Production deployment is not approved. Phase B has not started.**

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
