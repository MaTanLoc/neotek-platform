# Customer Auth verification/recovery hardening

Date: 2026-10-11 (Asia/Saigon)

## Result

Email/password registration creates an unverified account and queues the existing verification notification without creating a session. The frontend now proceeds to Verify Email with the submitted email and a 60-second resend countdown.

Email/password login still verifies the password first. Wrong credentials, unknown accounts and inactive accounts retain the existing generic authentication failure. Correct credentials for an unverified account return HTTP 403 with `{ "statusCode": 403, "message": "EMAIL_NOT_VERIFIED" }`, without a session cookie. This uses the existing safe error envelope; no global exception-filter change was needed. The frontend routes that response into verification with a validated return target.

Customer session issuance requires a verified account. Resolving an old unverified session deletes its Redis session and CSRF keys and returns 401. Existing CustomerProvider restoration clears the customer on 401, so that session cannot restore an authenticated navbar/avatar or access protected customer endpoints. Booking's independent verified-email checks remain in place.

Google authentication implementation, Google Calendar/Meet, notification providers, and unrelated pages were not changed. Google-created/linked verified identities continue through the existing session path. The controller's shared principal type accepts both authentication providers; session issuance checks the current database verification/version state.

## Verify Email and resend

Verify Email reuses AuthLayout, existing assets, auth tokens, fields, buttons and shared inline validation. It has waiting, verifying, success and invalid/expired states in Vietnamese and English. It verifies automatically exactly once per page entry, including React StrictMode effect replay, and captures a new token for a new navigation entry.

The waiting panel shows the known email in an editable email field. Its conditional generic copy preserves registration's existing enumeration-safe policy. It includes Inbox/Spam guidance, the one-hour verification expiry, a per-second disabled resend countdown, and a return-to-login action. Invalid/expired links offer the same functional resend form without raw backend errors. Success continues through Login, preserving only allowlisted booking/account return targets. External/invalid return targets fall back to the localized booking path via Login.

Because unverified users no longer have sessions, `POST /customer-auth/resend-verification` now accepts `{ email, locale }` without requiring customer authentication/CSRF. Exact Origin protection remains. It validates strictly and returns the same HTTP 202 `{ accepted: true }` for absent, inactive, already verified, cooldown and eligible accounts. It uses hashed IP/email rate-limit keys (10/IP/hour and 5/email/hour), retains existing customer limits, row locking, token rotation and the authoritative 60-second database cooldown. A resend never grants a session. Client cooldown is guidance; server controls remain authoritative, including after reload.

## Token and recovery audit

- Verification tokens retain 32 cryptographically random bytes, a SHA-256 lookup hash, one-hour expiry, and authenticated encryption of the notification outbox secret. The raw token is not persisted in cleartext.
- Verification locks the account and re-reads token state inside the transaction, rejects expired/revoked/used tokens, and consumes a successful token atomically. Concurrent verification has one winner; replay fails.
- A small shared runtime hook captures fragment tokens in a React ref and removes the fragment with `history.replaceState`, preserving router history state and non-secret query parameters. Neither token is copied into localStorage, sessionStorage, navigation state, or another URL. Existing links remain fragment-based.
- Reset submits the captured token only to the reset endpoint. Its existing 30–60 minute configured lifetime (45-minute default), atomic consumption, replay rejection, password policy, and `authVersion` increment remain unchanged. Existing customer sessions and stale login generations remain invalid after reset; CMS sessions stay separate.
- Forgot Password keeps its usable email form, enumeration-safe success transition, inline validation and existing backend notification architecture. No new delivery provider or resend flow was added to Forgot Password.
- Inspected request logging records method/route/status/request ID rather than raw request bodies or fragment tokens. No token-bearing analytics instrumentation was introduced.
- Provider failure tests preserve durable account and notification state; live email delivery was not exercised.

## Validation

| Check | Result |
| --- | --- |
| Backend ESLint across `src` | Passed |
| Backend production build | Passed |
| Backend Jest, `npm.cmd test -- --runInBand` | 34 suites / 234 tests passed; 5 opt-in integration suites skipped in this command |
| Disposable PostgreSQL, `scripts/test-booking-postgres.ps1` | 2 suites / 51 tests passed; all migrations replayed and second deploy had no pending migration |
| Real local Redis, customer/admin session integration | 2 suites / 2 integration scenarios passed; randomized test keys cleaned up |
| Frontend ESLint, `src` and browser fixture | Passed |
| Frontend production build, `VITE_API_BASE_URL=/api` | Passed |
| Chrome, `node scripts/check-form-validation.mjs --screenshots` | 72 grouped checks passed, zero unhandled browser exceptions |
| Whitespace, both repositories | `git diff --check` passed |

The PostgreSQL suite exercises real HTTP and database transitions: unverified registration; no session before verification; correct-password EMAIL_NOT_VERIFIED; old unverified session revocation; verified login and `/me`; expired/replayed/concurrently consumed tokens; password-reset replay and session invalidation; Google identity preservation; and notification failure/retry safety. Unit tests additionally check identical resend results for missing, inactive, verified, cooldown and eligible accounts. Redis tests verify real session/CSRF deletion, TTL, realm isolation and version checks.

The Chrome fixture mounts production form components under StrictMode and BrowserRouter with mocked external API/context boundaries. It checks all auth forms in VI/EN at 1440, 1024, 820 and 390 pixels, waiting/verifying/success/invalid verification states, safe return targets, countdown progression/expiry, immediate URL cleanup, absence of tokens from browser storage, captured reset payload, single verification submission, unverified-login/registration routing, no native browser invalid events or popup APIs, untouched/blur/correction behavior, stable inline error IDs, and first-invalid-field focus. Booking/admin validation regressions also remain covered. Browser checks do not claim live provider or live Google sign-in verification; backend Google tests use the existing verifier test boundary.

Saved visual evidence in `customer-auth-hardening-browser/` includes VI/EN waiting desktop and success/invalid mobile images. Desktop waiting and mobile success/invalid images were visually inspected for the existing split shell, spacing, readable wrapping and usable actions.

## Files in this pass

Frontend:

- `src/pages/auth/CustomerAuthForm.jsx`: verification routing after registration and unverified login; existing form design retained.
- `src/pages/auth/VerifyEmail.jsx`: scoped state panel, resend form and countdown.
- `src/pages/auth/PasswordRecovery.jsx`, `src/customer/useRuntimeToken.js`: immediate runtime capture/fragment cleanup.
- `src/services/customer/customerApi.js`: anonymous, Origin-protected resend payload.
- `src/pages/auth/neotek-auth.css`: verification panel styles and visible auth focus states.
- `scripts/check-form-validation.mjs`, `scripts/fixtures/form-validation.jsx`: expanded production-component browser regression and optional screenshot capture.
- This report and `docs/customer-auth-hardening-browser/*.png`.

Backend:

- `src/customer/customer.service.ts`: verified login requirement and enumeration-safe email resend.
- `src/customer/customer.controller.ts`: resend boundary and shared principal typing.
- `src/customer/customer-session.service.ts`: verified issuance and legacy-session revocation.
- `src/customer/customer.service.spec.ts`, `customer-session.service.spec.ts`, `customer-session.integration.spec.ts`: targeted resend/session coverage.
- `src/booking/booking-http-postgres.integration.spec.ts`, `booking-postgres.integration.spec.ts`: expected verified-only auth transitions and legacy-session assertions.

## Deployment and limits

This pass adds no migration or dependency. Deploy frontend and backend together because resend now accepts email/locale rather than requiring an unverified session. Existing database migrations, including the prior customer-phone migration, remain prerequisites. No migration was applied to an application/production database in this pass; integration used disposable PostgreSQL only. Local Redis tests used isolated randomized keys.

Live Resend delivery and live Google provider calls remain unverified. Existing dev/test delivery behavior is unchanged. The broader pre-existing dirty worktrees were preserved. No commit, push, deployment or Calendar/Meet implementation change was made. Stop after this patch.
