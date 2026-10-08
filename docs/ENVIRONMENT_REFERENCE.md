# Environment reference

Phase A inventory,2026-10-08. Covers both repositories. No real secret values are included. All VITE variables are public build-time values; never put server credentials in them. Runtime env changes do not update an already-built frontend. Dev/staging/prod flags below describe requirements, not new implemented validation.

| Variable | Owner | Dev | Staging/prod | Secret? | Purpose/current behavior |
| --- | --- | --- | --- | --- | --- |
| VITE_API_BASE_URL | Frontend | Optional with localhost fallback | Required public HTTPS API or approved relative same-origin URL | No | API base; currently not fail-fast. |
| NODE_ENV | Backend | development/test | Required production | No | Secure/__Host- cookies and production checks; do not deploy with development. |
| PORT | Backend | Optional3000 | Optional explicit service port | No | Listen port; validate range. |
| FRONTEND_URL | Backend | Optional localhost fallback for CORS; Origin-protected writes still need configured value | Required exact frontend origin | No | Credentialed CORS and Origin guard; scheme/host/port only, no wildcard/path. |
| DATABASE_URL | Backend/Prisma | Required | Required | Yes | Private DB credentials, TLS and intentional pool policy; no printing values. |
| REDIS_URL | Backend | Required for functional sessions/cache | Required | Yes when containing credentials | Private authenticated endpoint, TLS where policy requires; existing prod validation checks presence only. |
| CLOUDINARY_CLOUD_NAME | Backend | Required if uploads enabled | Required if uploads enabled | No | Cloudinary account/cloud identity; may be returned to client. |
| CLOUDINARY_API_KEY | Backend | Required if uploads enabled | Required if uploads enabled | No private credential by itself | Signing identity; signed client params include key. Keep configuration backend-owned. |
| CLOUDINARY_API_SECRET | Backend | Required if uploads enabled | Required if uploads enabled | Yes | Never frontend/VITE/logs; upload signature generation. |
| CLOUDINARY_UPLOAD_PRESET | Backend | Required if uploads enabled | Required if uploads enabled | No | Signed preset must enforce formats and10MB maximum; account settings require verification. |
| POSTGRES_USER | Dev Compose bootstrap | Required by Compose | Not an application runtime variable; production provider setup separately | No, operational identifier | Initial DB role; use separate least-privilege production runtime/migration roles. |
| POSTGRES_PASSWORD | Dev Compose bootstrap | Required | Secret manager/provider setup if relevant | Yes | DB bootstrap password; example placeholders must not be used in production. |
| POSTGRES_DB | Dev Compose bootstrap | Required | Provider setup if relevant | No, operational identifier | Initial database; DATABASE_URL controls application connection. |
| ADMIN_BOOTSTRAP_EMAIL | Backend manual create-admin script | Required unless CLI email argument | Only explicit bootstrap operation | Personal/operational data | Initial admin identity; not normal runtime configuration. |
| ADMIN_BOOTSTRAP_PASSWORD | Backend manual create-admin script | Required for bootstrap | Only explicit bootstrap operation | Yes | Passed by environment, not command argument; Argon2id hashed,12–256 chars; do not log. |
| AUTH_REDIS_TEST_URL | Backend integration test | Optional isolated test Redis | Not normal runtime | Yes if credentialed | Enables skipped live Redis/session test; never point at live production session store. |
| CHROME_PATH | Frontend browser regression | Optional local Chrome override | CI only, not frontend bundle/runtime | No | Browser executable; existing Windows default path. |

Proposed, **not implemented**: VITE_FEATURE_BOOKING=false; a separately named public customer-auth flag; public site-domain/staging-index policy configuration. Their exact names/semantics should be accepted in Phase B. No false claim that toggling a nonexistent variable currently hides a route.

Existing backend .env.example DB port5432 differs from dev Compose host5433. Align documentation in accepted cleanup; never copy development connection strings to production.

Production startup gate should validate mode, port, URL syntax, exact allowed frontend origin, required database/Redis configuration and enabled-media credentials without logging values. A separate validation policy must address private endpoints/TLS rather than rely on presence checks. Restrict secrets to backend/runtime secret injection; .env files are local conveniences, not deployment secrets management.

Use staging-specific credentials and Cloudinary policy. Document rotation owner and procedure outside source control. Opaque sessions depend on Redis; changing endpoints or flushing auth keys can log out users and requires an operational plan.
