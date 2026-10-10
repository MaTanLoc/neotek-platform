# Phase 2B.1 — Booking/Auth/Navbar UI recovery

Date: 2026-10-10. Presentation and interaction corrections requested after Google Login. No backend schema, API, token verification, authorization, session or Booking domain changes were made in this pass.

## 1. Checkpoint audit and drift

Baseline: `booking-v1-complete` at `7fe450bb`. The working tree already contained the uncommitted Phase 2B.1 implementation in both checkouts; it was inspected and preserved.

The initial frontend diff against the checkpoint contained seven tracked files, all Google/config/environment related, plus untracked Google component/report/browser artifacts. BookingPage, BookingDialog and Navbar matched the checkpoint. Consequently, their native module selectors, duplicate modal selection, sidebar logout, vertical form and missing navbar Login were pre-existing checkpoint issues, not changes introduced by Google Login. This pass corrects those issues according to the user's explicit UX requirements; it does not claim to restore a different unseen historical design.

Required Google additions retained: official GIS renderer, API exchange, CustomerProvider refresh/logout behavior, credential handling, flags and localized failures. No blind file restoration or broad formatting was performed. CRLF-only diff noise was excluded when reviewing visual changes.

## 2. Files changed in this pass

Frontend:

- `src/pages/booking/BookingPage.jsx`: one sidebar module control, require module before opening a slot review, remove sidebar auth actions, delegate navbar logout through existing release logic.
- `src/pages/booking/BookingModuleSelect.jsx`: thin Radix Select integration using the existing loaded module options and `flow.moduleKey`.
- `src/pages/booking/BookingDialog.jsx`, `BookingPage.css`: compact summary/status/form/actions and scoped Select styles.
- `src/components/layout/NeotekNavbar/NeotekNavbar.jsx`, `neotek-navbar.css`: restore Login, account trigger, existing mobile navigation integration and accessible Dialog title.
- `src/components/layout/NeotekNavbar/CustomerAccountMenu.jsx`, `customerInitial.js`: Radix account menu, initial fallback, safe logout error handling and focus restoration.
- `src/pages/auth/CustomerAuthForm.jsx`, `neotek-auth.css`: reuse existing auth grid/label/checkbox styling and visible keyboard focus.
- `src/customer/GoogleSignInButton.jsx`: only shorten separator copy to “hoặc” / “or”; official GIS behavior stays intact.
- `.gitignore`: ignore UI recovery PNG evidence, consistent with existing browser artifact handling.
- This report and `docs/booking-phase2b1-ui-recovery-browser/results.json`; local before/after PNGs are ignored.

Backend checkout:

- Only `scripts/check-booking-browser.cjs` was edited in this pass, to update UI selectors and add interaction assertions. Existing Phase 2B.1 backend source/schema/migration/config changes were left untouched.

## 3. Booking modal simplification

The summary includes date, time, duration/timezone and the selected module. Desktop summary uses two restrained columns. After a matching hold exists, a compact `Giữ chỗ còn 09:56` status replaces the previous boxed timer.

The existing name, read-only account email, company and phone fields use a two-column grid from 600 px; narrower forms use one column. Notes span both columns. No title/job/profile/product fields were added. Name prefill, read-only email, required fields and limits remain unchanged.

The primary action before hold remains Continue / Hold slot. After hold it is Confirm booking / Xác nhận đặt lịch, alongside one secondary Change time action. The duplicate Cancel / Back action is removed; the existing X, outside dismissal and Escape use the existing close/release handler. Successful submission retains the existing success/next-booking behavior.

## 4. One module control and state

The Booking sidebar is the only module selector; its source remains `flow.moduleKey`. The modal displays its resolved localized label and never renders a second selector. Clicking a slot without a chosen module shows the existing localized prompt and focuses the Radix trigger; it does not open another selection dialog or acquire a hold.

Selecting a valid calendar slot still creates only local selection/intent. Only Continue invokes the established acquire/authentication flow. Server availability, hold TTL, conflict/replacement behavior, idempotency and finalize payloads are unchanged.

## 5. Navbar states and preserved CTA

The old navbar referenced absent `FEATURES.publicAuth`, making Login invisible. Anonymous customers now see a localized Login affordance while the existing navigation and Demo CTA remain. The Demo destination stays `/register` (or `/en/register`), matching the checkpoint.

Authenticated customers see an initial avatar and chevron instead of Login. Desktop reserves a fixed auth slot during restoration. Mobile reserves one existing navigation trigger containing the avatar and menu icon; its existing drawer contains the same Radix account menu. No independent competing mobile account drawer or second top-level menu was added.

No standalone Login, My Bookings or Logout actions remain in the Booking sidebar. My Bookings' existing account-page layout/actions remain unchanged.

## 6. Avatar fallback

Use the first Unicode character of trimmed customer name, then trimmed email, then `?`, uppercased. This product has no safely persisted customer avatar, so no image/profile field or Google picture persistence was introduced.

## 7. Account dropdown and accessibility

Radix DropdownMenu contains a non-interactive name/email header, My Bookings linking to the real localized `/account/bookings`, a separator and Logout. No fake account/settings destination exists.

Arrow keys and Enter select menu items; Escape returns focus to the trigger. After successful keyboard logout, focus moves to the restored Login link. Failure leaves authentication intact and shows safe localized feedback. On Booking, the menu calls the existing `clearSelection` / `flow.release` before logout and stops if release fails, preserving the previous sidebar-logout ordering. Change time keeps its existing behavior: close the review while retaining the prior hold until replacement, explicit release or expiry.

## 8. Radix reuse

Select and DropdownMenu come from the already-installed `radix-ui` package. Booking and mobile navigation retain their existing Radix Dialogs. The Select uses loaded module keys, Radix focus/typeahead/keyboard behavior and portal sizing, with NeoTek tokens and the existing restrained Select styling pattern. The duration control remains the existing styled native radio group, not a browser select. Existing language navigation remains scoped and unchanged. No dependency or bespoke accessibility primitive was added; no destructive action requires a new AlertDialog.

## 9. Auth form restoration

AuthLayout's split visual/form structure, branding, typography, wrapper sizes, links and destinations remain. Register reuses `.auth-form-grid` for name/email and password/confirmation pairs; the existing 480 px media rule collapses it to one column. Login remains one column. Labels, show-password control, autocomplete, password limits and confirmation checks remain accessible.

The official GIS-rendered button stays above a restrained separator and the existing form. No fake Google button or additional panel was introduced. Existing script failures, missing configuration, backend rejection and safe returnTo behavior remain supported.

## 10. Responsive results

Browser validation covers VI/EN at 1440, 1024, 820 and 390: Booking, hold review, Login, Register, anonymous navbar, authenticated navbar/menu and My Bookings. It checks horizontal overflow, two/one-column form layout, menu keyboard/focus behavior, modal focus containment and close/release behavior. The final run passed 183 checks with zero unhandled exceptions.

## 11. Regression validation

- Frontend ESLint and Vite production build passed; production source map count is zero.
- Full existing Jest suite with real Redis integration enabled: 199 passed, 45 PostgreSQL cases intentionally skipped here and run separately.
- Disposable PostgreSQL suites: 45 passed; migration replay twice and compiled production smoke passed. No production/local database schema change was needed for this UI pass.
- Browser: 183 checks passed with zero unhandled exceptions. All previous 136 functional/layout checks remain, adapted to choose the module before the modal and use X for explicit cancellation. The 47 additional checks cover Radix selection, no duplicate controls, compact grids, Login/Demo preservation, account menu navigation/logout/focus, release before logout, retained hold on Change time and sidebar auth removal.
- Existing password registration/login, verification and resend, recovery, expired/reused reset links, customer/admin isolation, real hold replacement/conflict/expiry/release, idempotent finalize retry, My Bookings and Admin Booking remain exercised. Public Home/Solutions/detail/CMS regression checks remain; no section styling/content was changed.

Browser reproduction: build the frontend with process-local `VITE_API_BASE_URL=/api` for the harness proxy (restore normal dev settings afterwards), then run from backend:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/test-booking-postgres.ps1 -Browser -ProductionSmoke
```

Artifacts and structured evidence: [browser results](booking-phase2b1-ui-recovery-browser/results.json).

## 12. Google Login preservation and limits

The browser suite mocks only the GIS script/callback and backend Google-verifier boundary; real PostgreSQL, Redis sessions, CSRF, identity linking and Booking remain active. Tests retain Login/Register Google callbacks, verified passwordless customer creation, session `/me`, preserved booking intent and server hold acquisition, safe returnTo, My Bookings, logout and GIS failure fallback.

Live Google login was not manually retested in this pass. The user's existing working setup and public client ID were retained. Deterministic screenshots use a mock Google control; production still uses the official renderer. No Calendar/Meet, profile system, Google avatar persistence, SMS, deployment, commit or push was added.

## 13. Before/after evidence

Before images were copied from the preceding Phase 2B.1 browser artifacts, without overwriting those original artifacts. After images come from the current suite. All PNGs remain local ignored evidence:

| View | Before | After |
| --- | --- | --- |
| Booking review | [before](booking-phase2b1-ui-recovery-browser/before-hold-review-en.png) | [after](booking-phase2b1-ui-recovery-browser/hold-review-en.png) |
| Register desktop | [before](booking-phase2b1-ui-recovery-browser/before-google-register-en-1440.png) | [after](booking-phase2b1-ui-recovery-browser/google-register-en-1440.png) |
| Register mobile | [before](booking-phase2b1-ui-recovery-browser/before-google-register-en-390.png) | [after](booking-phase2b1-ui-recovery-browser/google-register-en-390.png) |
| Login mobile | [before](booking-phase2b1-ui-recovery-browser/before-google-login-vi-390.png) | [after](booking-phase2b1-ui-recovery-browser/google-login-vi-390.png) |
| Account desktop/mobile | — | [desktop](booking-phase2b1-ui-recovery-browser/navbar-account-vi-1440.png), [mobile](booking-phase2b1-ui-recovery-browser/navbar-account-vi-390.png) |
