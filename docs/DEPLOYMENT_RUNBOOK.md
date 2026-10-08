# Deployment runbook proposal

**Phase A draft. No deployment, Docker implementation, migration or production change is authorized by this document.** Consult [audit](PRODUCTION_READINESS_AUDIT.md) for blockers and [environment](ENVIRONMENT_REFERENCE.md) for current variables.

## Proposed topology

Internet -> CDN/WAF -> static Vite frontend and reverse proxy -> private NestJS service -> private PostgreSQL/Redis. Cloudinary is external. Restrict direct origin access; database/Redis have no public listeners. Redis guidance: [official security documentation](https://redis.io/docs/latest/operate/oss_and_stack/management/security/).

Serve frontend dist as immutable static releases; do not serve Vite dev/preview as production origin. Set real public HTML security/cache policies and staging/admin noindex. Dist assets use hashed immutable cache; HTML must support controlled release changes. Configure SPA deep links and deliberate HTTP404/verified permanent aliases; a blanket200 fallback is not sufficient SEO validation.

Backend strategy for later Phase D: accepted Node LTS compatible with lockfile and native Argon2; deterministic npm ci; Prisma generate; Nest build; inspect actual artifact path; production dependency packaging; non-root user; no source .env/secrets; correct signal delivery/health wiring. Phase B corrected the compiled entry point; Phase C additionally requires explicit NODE_ENV=production and validates an isolated default Nest build/start. Do not automatically upgrade Prisma/Nest/Node major versions while containerizing.

## Acceptance gates

1. Phase A accepted; B/C fixes validated. No BLOCKER; every unresolved HIGH has documented mitigation/owner.
2. Credentials managed, exact same-site HTTPS frontend/API topology accepted, private network verified; least-privilege DB and authenticated session-safe Redis. Decide proxy trusted hops and WAF/bot/rate/request/connection/time limits.
3. Reproducible frontend/backend builds, measured public/admin split, bounded readiness503, graceful restart/drain, clean logging and alerts.
4. Backup policy and successful isolated restore drill recorded, including elapsed recovery and application checks.
5. Schema drift reviewed. In installed Prisma6 production workflow, use `prisma migrate deploy` only under explicitly approved deployment operation. Never migrate dev/reset or automatic seed/demo/population/cleanup. Migration and release compatibility must be reviewed before execution.
6. Staging integration and responsive checks pass; production approval is separate from this proposal.

## Staging checklist

- Public Home/Solutions/Detail VI/EN at1440/1024/820/mobile; canonical shared slug, metadata/hreflang, real404, verified alias redirects preserving locale without loops.
- Locale switch preserves section/position; normal navigation and Back/Forward restore remain correct; sticky navbar/rail unaffected by transforms.
- Booking/customer auth flags hide routes AND links/CTAs; direct paths return controlled404; public users never reach admin auth by substitution.
- Real admin login/logout/session expiry/roles; CSRF and exact Origin rejection; save/publish/unpublish and unsaved guards; unpublished content never public, even with stale Redis/invalidation failures.
- Canonical CTA/FAQ/Trusted consumers in both languages after specifically approved shared-content migration; Footer CTA separate.
- Actual signed Cloudinary upload and type/size/quota rejection; portrait editing and detail article manager/tutorial regressions.
- DB/Redis readiness, bounded outages, restart behavior, proxy IP handling, header/CSP compatibility, error/log redaction and alerts. Mocked browser tests do not substitute for these real checks.

## Rollout and rollback proposal

Record source checkpoints, lockfiles, immutable frontend/backend artifact IDs, environment version, approved migration list and backup recovery point. Deploy to staging first. Production rollout requires separate accepted gate, smoke checks, bounded observation window and named rollback owner.

Frontend rollback: restore previous static release/HTML pointer, preserve matching hashed assets, validate VI/EN deep links and API compatibility. Backend rollback: previous immutable release/image only if compatible with current database/schema and cookie/session policy; verify readiness and errors.

Database downgrade is not assumed safe. Prefer forward-compatible migrations and corrective forward migration. Backup restoration requires explicit approval of data loss window, maintenance/write suspension and isolated rehearsal. Never restore over the live DB as an automatic rollback step. Secret compromise requires rotation/revocation separately from code rollback.


## Phase C handoff: requirements for Phase D (not implemented infrastructure)

Internet -> CDN/WAF -> reverse proxy -> private NestJS -> private PostgreSQL/Redis. Phase C implemented source controls and local runtime validation only. Production is not approved; no Dockerfiles, provider setup or staging deployment were created.

### Reverse proxy and static frontend contract

- Terminate HTTPS at the edge/proxy; redirect HTTP to HTTPS. Use TLS to origin where available and verify certificates. Keep backend inaccessible from the public internet so headers cannot bypass the trusted edge.
- Proxy must remove client-supplied Forwarded/X-Forwarded-* headers and rebuild the chain from verified peers. Set X-Forwarded-Proto from actual HTTPS termination, X-Forwarded-Host from validated host, and X-Forwarded-For from verified client/edge data. Restrict backend TRUST_PROXY to actual reverse-proxy IPs/subnets and any verified intermediate ranges required by the chain. Numeric hop counts and trust=true are forbidden. Test request.ip/request.secure behind the actual chain and reject a forged direct-origin path. Secure cookies do not depend on trusting an arbitrary forwarded header; they are always Secure in production.
- Prefer same-origin frontend /api routing; same-site HTTPS subdomains are acceptable with exact FRONTEND_URL/CORS. Set NODE_ENV=production/PORT explicitly. Configure both production and staging independently with separate secrets; do not allow broad multiple-origin patterns.
- Match backend body policy: JSON2MiB, form64KiB/100 parameters. Proxy global body cap must accommodate2MiB JSON plus framing; enforce the smaller form limit in application. Cloudinary files upload directly to image/upload, never through the backend JSON endpoint. Enforce body/header/read timeouts, concurrency and connection limits; do not allow an unbounded slow upload.
- Set explicit upstream connection/response/idle timeouts, keepalive and maximum draining duration. Choose budgets above the app's2s dependency deadline and legitimate CMS save latency; start staging with connect5s/response30s/termination30s, then measure. These are proposed budgets, not provisioned settings. SIGTERM must reach Node; wait for drain/hooks, then the supervisor may force termination after its grace budget. Native Linux/container signals and in-flight requests must be verified in Phase D.
- Compress static text assets. Hashed JS/CSS/fonts get immutable caching; HTML gets revalidation/no immutable caching. Auth/admin API never caches, including errors; respect Cache-Control:no-store and cookies, bypass CDN caching. Keep /api/health private to probes where possible and avoid high-frequency dependency polling.
- Serve frontend static dist only, never Vite dev/preview. Keep backend dist and maps private; never expose server source/operational scripts. Frontend maps are disabled. Do not enable WebSocket forwarding: no current backend feature requires it. Configure only after a verified future requirement.
- Add frontend HTML CSP separately from API CSP. Proposed starting policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; font-src 'self'; img-src 'self' https://res.cloudinary.com blob: data:; connect-src 'self' [exact approved HTTPS API] https://api.cloudinary.com; style-src 'self' 'unsafe-inline'. The temporary inline-style allowance supports existing React/GSAP/Radix/Tiptap sizing/positioning; no unsafe-inline script or unsafe-eval. Blob/data image allowances support local admin previews, not persisted CMS URL acceptance. Start with report-only in staging, observe real fonts/images/uploads, narrow hosts, then enforce; do not silently disable CSP. Add production HSTS after confirming all intended HTTPS hosts, nosniff, restrictive referrer/Permissions-Policy, and frame protection for admin HTML. Confirm X-Robots-Tag/noindex for staging/admin; frontend route noindex already exists but is not a hosting header.

### PostgreSQL and Redis contract

- PostgreSQL private endpoints/firewall only; no public5432 or promotion of development Compose's host5433. Separate production/staging credentials. Application role is not postgres/superuser: grant only required schema/table/sequence privileges. Migrations use separate reviewed credentials and explicit migrate deploy. No automatic seed, demo import, content cleanup or shared-content apply.
- Use verified TLS/provider CA where supported/required; never disable verification merely to connect. Set finite connection/pool/statement budgets. Size per-instance pool so replicas plus maintenance connections stay within DB capacity. Phase C health timeout bounds HTTP waiting, not cancellation of the underlying SQL query. Run read-only drift/catalog verification and monitor pool exhaustion in staging.
- Redis private network only; authenticated ACL scoped to required auth/session/cache keys/commands, including the existing atomic EVAL operations. Use verified TLS where supported, no public6379, no production flush/KEYS scans. Do not expose Redis credentials to frontend/logs.
- Redis currently serves both opaque sessions and public cache. Use a session-safe noeviction policy with capacity/headroom, expiry discipline and alerts; session loss deliberately invalidates login, never bypasses auth. Separate stores require a separately reviewed future change, not an assumed Phase C redesign. Accept restart durability/RPO and encryption/access/backup policy explicitly; AOF or a volume is not a restore drill.
- Test isolated disconnect/reconnect, timeout, process restart, quota/capacity and recovery under load without targeting the real session store. Public DB delivery must continue when cache Redis fails; admin auth must reject verification. Healthy readiness requires Redis because it remains session-critical. Dedicated AUTH_REDIS_TEST_URL remains an opt-in integration dependency, never point it at production.

### CDN/WAF and operational gates

- Enable managed volumetric DDoS protection, reviewed managed WAF rules, bot filtering and challenge/escalation rules. Apply edge login/signing/admin path rates plus request/connection/time limits; application quotas complement the edge and cannot stop volumetric attacks. Keep normal public CMS GETs usable. Challenge suspicious traffic before it reaches private origin, and prevent direct origin bypass with firewall/provider restrictions.
- Preserve application status distinctions400/401/403/409/413/429/500/503; configure retries carefully. Never blindly retry login/logout/admin mutations after a timeout because a datastore operation may already have committed. Cache only approved public data and never bypass publication guards by caching admin/draft responses.
- Route generated request IDs and safe route/status/duration logs into monitoring. Alert on5xx/latency/readiness/restarts, DB pool/load, Redis memory/evictions/auth errors, and upload quota/cost. Do not send bodies, cookies, authorization headers, CSRF, secrets or raw DSNs to diagnostics.
- Patch the selected Node22 LTS runtime and pin the exact verified patch in future build/runtime delivery; current local22.12.0 is compatibility evidence only. Source engines retain major22. Reassess known dependency advisories before building trusted immutable artifacts. Argon2's tar/native-install critical advisory is not a known HTTP extraction endpoint, but build/install provenance is still a release gate: trusted registries/artifacts, restricted builders, no untrusted archives, and a separately reviewed compatible/migration upgrade. Do not audit-fix --force or downgrade Prisma blindly.
- Verify Cloudinary signed preset10MB/formats/image-only behavior, account permissions, transformations, quotas and real authenticated upload in staging. Mocked browser upload tests do not establish provider enforcement.
- Complete backup/restore, rollback, exact public domain/robots/sitemap, native signal and actual proxy-header/CSP tests before release. Shared CTA/FAQ migration and missing module slugs require separate business/data approval; Footer CTA remains distinct. No migration was run by Phase C.

### Repeatable Phase C local validation

Backend: Prisma validate, full Jest --runInBand, lint with --no-fix, and node scripts/check-runtime-hardening.cjs. The latter copies source/config into an owned OS-temp directory, junctions dependencies, runs the real default npm build and npm start:prod on temporary ports, reads publication status, and checks health/auth/public routes. It does not write DB records or execute maintenance scripts. It exercises unreachable temporary Redis/DB addresses without stopping development services. Only normal public-cache operations occur against developer Redis.

On Windows the harness emits SIGTERM/SIGINT events into the real Nest handlers (native process.kill would forcibly terminate Windows processes), confirms Prisma/Redis hooks, process exit and closed port, and tests fatal/rejection redaction. Its control preload exists only inside the owned temporary directory and is never shipped. Native Linux signal delivery and supervised container drain remain a Phase D gate. The harness removes only its owned processes/temp directory and does not replace live backend dist.

Frontend lint/build uses explicit VITE_API_BASE_URL=/api; full browser regression runs read-only fixtures with mocked auth/saves/Cloudinary at1440/1024/820/390. Screenshot writes were suppressed. Detailed results and remaining gates are recorded in PRODUCTION_READINESS_AUDIT.md.
