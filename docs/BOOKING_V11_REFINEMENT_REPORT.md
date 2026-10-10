# Booking V1.1 refinement

Date: 2026-10-10. Scope: authenticated navigation, booking status/Meet confirmation, email transport, private calendar overlays and small account/admin/auth refinements. The approved Booking layout, CMS shell, customer/Google authentication, scheduling policy and hold concurrency remain in place.

## Workflow and database

Visible workflow:

| State | Vietnamese | Permitted next states |
| --- | --- | --- |
| PENDING | Chờ xác nhận | CONFIRMED, CANCELLED |
| CONFIRMED | Đã xác nhận | CANCELLED, COMPLETED |
| CANCELLED | Đã hủy | None |
| COMPLETED | Hoàn thành | None |

Backend input validation and domain transition checks enforce these edges. The existing PostgreSQL transition trigger is updated too. Cancellation still requires a reason; optimistic `expectedVersion` checks, admin authorization, CSRF and Origin guards remain. Existing timing rules remain: confirmation must precede the appointment start, and completion is allowed after its end.

Migration: backend `prisma/migrations/20261010000000_booking_v11_meeting_url/migration.sql`. Adds one nullable, provider-neutral `Booking.meetingUrl` field (`VARCHAR(200)`) and updates the existing status trigger. Applied to the local development database; migration status is up to date. Replayed twice on disposable databases. No production deployment or migration was performed.

The legacy database enum value `NO_SHOW` is retained solely to preserve old persisted/audit data. V1.1 rejects it in transition input/domain/database updates and removes it from workflow controls and filters. Historical records are not silently converted to another status.

## Manual Google Meet

`PENDING → CONFIRMED` requires a canonical URL of the form `https://meet.google.com/abc-defg-hij`. Both frontend and backend reject missing URLs, HTTP, foreign/lookalike hosts, credentials, query strings and malformed meeting codes. The database also checks the URL on confirmation. This phase deliberately supports the plain Google Meet code URL only.

Admin enters the URL when confirming. It is persisted atomically with status/version/audit/outbox changes and returned by customer-owned booking endpoints and admin detail. The URL is read-only after confirmation; no endpoint for editing it is added. Future automatic generation can populate the same field.

Older confirmed bookings retain a null URL rather than receiving an invented meeting link. This pass does not add a backfill/edit action for already-confirmed legacy bookings.

## Notifications and Resend

The existing path is preserved:

`Booking/Auth → NotificationDelivery → NotificationService/worker → EmailProvider → Resend`

Status changes persist a notification intent in the domain transaction. Confirmation/cancellation intents contain an immutable snapshot of customer name, solution, requested start/end, timezone and meeting URL. Confirmation rendering includes the name, solution, localized date/time interval, duration, timezone, Google Meet URL and account link. Cancellation has its own localized template and does not offer a meeting join link. Older intents can still render using booking data.

Provider I/O remains outside the booking transaction. A provider failure leaves the booking CONFIRMED and the delivery pending with the existing bounded retry/backoff, lock recovery and deduplication key. Existing attempts are exhausted after five failures. No new queue, worker system or provider framework was introduced.

Replaced the raw Resend HTTP call with the official `resend` Node SDK (installed version 6.32.1). Each request uses the existing delivery idempotency key and an eight-second abort signal; the dispatcher retains its ten-second deadline. SDK errors/malformed responses fail delivery rather than returning a false message ID. Application errors and persisted delivery codes contain no credential values. [Official Node SDK setup](https://resend.com/docs/send-with-nodejs) and [provider idempotency behavior](https://resend.com/docs/dashboard/emails/idempotency-keys).

Backend-only configuration, documented in backend `.env.example`:

```dotenv
EMAIL_PROVIDER=resend
RESEND_API_KEY=<configure locally; never commit>
EMAIL_FROM=<sender on your verified domain>
EMAIL_REPLY_TO=<optional valid reply mailbox>
EMAIL_TEST_TO=<explicit manual test recipient>
```

With `EMAIL_PROVIDER=resend`, startup rejects a missing/blank API key, invalid/missing sender and an invalid configured reply-to in development and production. Error messages name configuration variables without printing values. The explicit private-file `dev` transport remains for deterministic tests; production still requires Resend.

Use a verified sender/domain. Resend's allowed `onboarding@resend.dev` testing sender can send only to the email associated with that Resend account; sending to other recipients requires a verified domain. No sender is hardcoded in implementation. [Resend testing-sender limitation](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

Manual test: configure the backend environment and run `npm.cmd run email:test` from `Neotek Backend`. It sends one explicit transport-test message through the configured EmailProvider/SDK, without creating or modifying bookings, accounts or outbox records. It never overrides customer recipients. Success reports provider acceptance; inbox arrival/Resend delivery status must still be checked separately.

**Real-email result:** not sent. Workspace preflight found no `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` or test recipient. The manual command failed safely before sending. Configuration and a permitted recipient were requested during implementation. No live Resend acceptance or inbox-delivery claim is made; automated transport tests mock the SDK's HTTP boundary.

## Customer UI

- Anonymous navbar keeps Login and Đăng ký Demo. Authenticated customers see the account/avatar menu, with both Login and Demo CTA hidden on desktop and mobile. Other navigation remains unchanged.
- Login/Register keep their approved forms. Order is credentials, primary submit, separator, Google button, account-switch link. Google callbacks, linking, returnTo, password fallback and session behavior remain unchanged.
- My Bookings keeps the public account layout and existing Upcoming/Past tabs. Pending cards say “Chờ NeoTek xác nhận lịch hẹn”; confirmed cards with a valid URL show “Google Meet” and “Tham gia cuộc họp”. Cancelled/completed cards have no join action. Logout remains in the account menu.
- Calendar availability remains the public source of occupancy. A separate authenticated `/booking/mine` request overlays the owner's solution, time and status without email, phone, company or name in the event block. Other customers/guests still receive generic unavailable intervals. No occupied slot becomes selectable because of the overlay.
- `/mine` now accepts an optional paired `from`/`to` range with interval-overlap filtering, retaining customer ownership and pagination. The calendar loads pages only for its visible range, refreshes every 30 seconds and after booking mutations, aborts obsolete requests, and hides old private data immediately when the account changes/logs out. Cancelled bookings do not render as occupied events. Weekly/day overlays link to My Bookings; Month also annotates own events.

## Admin UI

The master-detail layout and CMS shell are retained. Pending detail provides a Meet URL field, Cancel and Confirm; Confirm stays disabled until the URL is valid. Confirmed detail displays the read-only link, Cancel and Mark completed; completion remains disabled until the appointment ends. Cancellation collects a reason and uses the existing Radix AlertDialog confirmation provider. Cancelled/completed details expose no workflow action. History, notes, delivery summaries, compact Radix status filter and existing pagination remain.

## Files changed in this pass

Frontend:

- `src/components/layout/NeotekNavbar/NeotekNavbar.jsx`
- `src/pages/auth/CustomerAuthForm.jsx`, `src/customer/GoogleSignInButton.jsx`
- `src/customer/customerCopy.js`, `src/services/customer/customerApi.js`
- `src/pages/booking/BookingPage.jsx`, `WeekCalendar.jsx`, `MonthCalendar.jsx`, `BookingPage.css`
- `src/pages/account/MyBookings.jsx`
- `src/admin/pages/BookingsManager.jsx`, `bookings-manager.css`
- `.gitignore`, this report and `docs/booking-v11-browser/results.json`

Backend:

- `prisma/schema.prisma`, new migration listed above
- `src/booking/booking-domain.ts`, `booking.service.ts`, `booking.controller.ts`, `booking-environment.ts`
- `src/notification/email-provider.ts`
- Booking domain/PostgreSQL/HTTP integration specs and `src/notification/email-provider.spec.ts`
- `package.json`, `package-lock.json`, `.env.example`, new `scripts/test-email.ts`
- `scripts/check-booking-browser.cjs`

Pre-existing Google Login and earlier UI changes in both dirty checkouts were preserved. No unrelated page, CMS shell or hold/finalize core refactor.

## Validation and screen checks

| Check | Result |
| --- | --- |
| Prisma validate / generate | Passed |
| Local migration status | Up to date, six migrations |
| Disposable migration replay, twice | Passed |
| Backend lint / build | Passed; 13 provider tests also passed after final response-validation check |
| Full Jest with real Redis enabled | 214 passed; PostgreSQL suites run separately |
| PostgreSQL domain + HTTP integration | 49 passed |
| Compiled production-entry smoke | Passed; empty outbox, no provider traffic |
| Frontend source lint / production build | Passed; zero production source maps |
| Browser | Final run: 300 checks passed, zero unhandled exceptions |
| Real Resend delivery | Not executed: missing local configuration/recipient |

Browser coverage uses VI/EN at 1440, 1280, 1024, 820 and 390 px, real disposable PostgreSQL, namespaced Redis, local dev mail and Chrome. Only Google GIS/verifier and Resend unit-test HTTP boundaries are mocked. Includes owner/public privacy, range queries, conditional navbar, pending/confirmed/terminal admin actions, valid/invalid Meet, account join link, Google placement, keyboard/focus, hold replacement/conflict/expiry/idempotency and public/CMS regressions.

Screenshots are local ignored PNG artifacts; [structured results](booking-v11-browser/results.json) are separate. Screen inspection confirmed restrained owner-event styling, hidden authenticated CTA, Meet presentation and the requested Google placement. Target evidence:

| Width | Own booking | Confirmed account | Auth |
| --- | --- | --- | --- |
| 1440 | [VI](booking-v11-browser/own-booking-vi-1440.png) | [VI](booking-v11-browser/my-bookings-meet-vi-1440.png) | [Login EN](booking-v11-browser/google-login-en-1440.png) |
| 1024 | [EN](booking-v11-browser/own-booking-en-1024.png) | [EN](booking-v11-browser/my-bookings-meet-en-1024.png) | [Register VI](booking-v11-browser/google-register-vi-1024.png) |
| 820 | [VI](booking-v11-browser/own-booking-vi-820.png) | [VI](booking-v11-browser/my-bookings-meet-vi-820.png) | [Login VI](booking-v11-browser/google-login-vi-820.png) |
| 390 | [VI](booking-v11-browser/own-booking-vi-390.png) | [VI](booking-v11-browser/my-bookings-meet-vi-390.png) | [Register VI](booking-v11-browser/google-register-vi-390.png) |

Admin: [pending Meet](booking-v11-browser/admin-pending-meet.png), [confirmed desktop](booking-v11-browser/admin-booking-1440.png), [mobile detail](booking-v11-browser/admin-booking-detail-390.png), [cancelled](booking-v11-browser/admin-cancelled-terminal.png), [completed](booking-v11-browser/admin-completed-terminal.png).

Reproduce: frontend `npm.cmd exec eslint -- src --max-warnings 0`, then build with process-local `VITE_API_BASE_URL=/api` for the harness. Backend `npm.cmd exec eslint -- src`, `npm.cmd run build`, `npm.cmd test -- --runInBand --no-cache` with `AUTH_REDIS_TEST_URL` configured. Run `scripts/test-booking-postgres.ps1 -ProductionSmoke` and `scripts/test-booking-postgres.ps1 -BrowserOnly` separately for fresh isolated databases.

## Deferred and remaining external checks

- Configure backend Resend credentials, verified sender and permitted test recipient; run the manual test and verify inbox delivery. Credentials are never requested in chat or committed.
- Live Google account login was not manually retested; the deterministic regression exercises its existing callbacks/session integration.
- No Calendar sync, automatic Meet generation, SMS, new queue infrastructure, post-confirmation link editing, deployment, commit or push.
