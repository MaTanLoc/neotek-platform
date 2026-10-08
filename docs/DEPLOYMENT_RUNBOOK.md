# Deployment runbook proposal

**Phase A draft. No deployment, Docker implementation, migration or production change is authorized by this document.** Consult [audit](PRODUCTION_READINESS_AUDIT.md) for blockers and [environment](ENVIRONMENT_REFERENCE.md) for current variables.

## Proposed topology

Internet -> CDN/WAF -> static Vite frontend and reverse proxy -> private NestJS service -> private PostgreSQL/Redis. Cloudinary is external. Restrict direct origin access; database/Redis have no public listeners. Redis guidance: [official security documentation](https://redis.io/docs/latest/operate/oss_and_stack/management/security/).

Serve frontend dist as immutable static releases; do not serve Vite dev/preview as production origin. Set real public HTML security/cache policies and staging/admin noindex. Dist assets use hashed immutable cache; HTML must support controlled release changes. Configure SPA deep links and deliberate HTTP404/verified permanent aliases; a blanket200 fallback is not sufficient SEO validation.

Backend strategy for later Phase D: accepted Node LTS compatible with lockfile and native Argon2; deterministic npm ci; Prisma generate; Nest build; inspect actual artifact path; production dependency packaging; non-root user; no source .env/secrets; correct signal delivery/health wiring. Current start:prod is broken and must be corrected before defining an image command. Do not automatically upgrade Prisma/Nest/Node major versions while containerizing.

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
