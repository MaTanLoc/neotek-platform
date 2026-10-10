# NeoTek Booking UI recovery and redesign

Date: 2026-10-10. Scope: public Booking, booking modal, My Bookings, customer navigation and Admin Booking. The previous layouts were treated as incorrect baselines. Existing tokens, brand assets, public navigation and CMS shell provide the visual foundation.

## 1. Public scheduling workspace

- Reconstructed a restrained, bordered workspace within the existing 1280 px container, with a 240 px support column (216 px on tablet) and the main schedule on the right.
- The support column has exactly three children, in order: mini calendar, duration controls, legend. Timezone context lives inside the legend. Solution selection and auth actions are absent from the sidebar.
- The date range, Today, navigation arrows and Month/Week/Work week controls live in one compact schedule toolbar. Work week remains the default; existing functional Month and Week views remain.
- The mini calendar highlights the selected date/week and retains month navigation and arrow-key navigation. Duration remains the existing 30/45/60 minute radio group using server policy options.
- The legend distinguishes availability, booked/unavailable, local selection and the customer's own active hold. Public availability does not disclose other customers' details or distinguish their reservations from bookings; both correctly remain unavailable.
- Reduced the intro, controls, day headings and timeline row spacing. Schedule geometry uses 32 px per half-hour, derived from the existing server policy hours.
- Removed the schedule's independent vertical scroll region. Booking and My Bookings bypass ScrollSmoother and use native document scrolling; marketing routes retain their existing smoother. Admin Booking also bypasses the transformed smoother so its existing fixed CMS shell stays anchored to the viewport and `.admin-main` handles detail scrolling. Horizontal scroll is contained only where a seven-day view needs it. Keyboard cursor and drag edge scrolling follow the page.
- Mobile stacks the three support sections above a readable one-day schedule. The monthly mini calendar can expand from a compact date control. Duration and legend remain visible.

## 2. Modal and interaction flow

Clicking or keyboard-selecting an available slot opens the modal directly, without a solution pre-step and without acquiring a hold. The modal collects the solution through one Radix Select backed by the existing `flow.moduleKey`; restored booking intent carries its existing solution into this control.

The modal shows date, time, duration and timezone, with a small authoritative countdown only when the selected time/solution matches the customer's hold. Contact fields use two columns on desktop and one below 600 px. Notes and solution selection span the form. Primary action: **Đặt lịch ngay / Book now**. Cancel, X, Escape and permitted outside dismissal call the existing release handler. A subordinate Change time link is available while holding a slot, retaining the existing replacement behavior.

The identity contract exposes name and email, so those are prefilled. Email remains read-only; name remains editable. Phone and company are mandatory finalize fields and are requested because the session provides no persisted values for them. No unsupported profile fields were invented. Initial focus targets a missing contact field, then the solution control.

One primary action with complete contact data acquires a hold and immediately finalizes through the existing APIs. If mandatory contact information is still missing, native validation identifies it and the confirmed slot remains held while the customer completes it. Anonymous or unverified customers follow the existing login/verification route and restore their slot/solution intent.

The only flow integration adjustment is returning the acquired hold object from `acquire` and allowing `finalize` to use that object immediately. This avoids waiting for a React render between the existing server operations. Server policy, hold TTL, atomic replacement, conflict handling, idempotency keys, finalize retries, release and ownership guards are unchanged. No backend business code, schema or API was modified.

## 3. My Bookings account page

Removed AuthLayout entirely. My Bookings now uses the public navbar/footer, normal content container, concise account header and a booking CTA. Radix Upcoming/Past tabs drive the existing paginated API.

Each appointment has a compact date marker, solution heading, status badge, date/time, duration, timezone, contact/company summary and meeting availability. The existing API currently returns `meetingUrl: null`, displayed as “will be updated later”; no meeting destination is fabricated. A future actual HTTPS URL can be displayed safely.

Loading, session failure, sign-in, empty results, retry and pagination remain available. Logout is absent from the page body and is provided by the navbar account menu.

## 4. Customer navigation and guest routes

Retained the existing Radix account menu: initial avatar, name/email header, real localized My Bookings link and Logout. The customer model exposes no avatar image, so initials remain the supported fallback. Anonymous customers see Login and the existing public Demo CTA.

Authenticated customers see the avatar without guest Login/Register links. The Demo CTA points to Booking for authenticated customers, and keeps its original Register destination for guests. Mobile keeps the existing navigation drawer and the account menu inside it.

Login and Register now redirect authenticated customers using the existing safe returnTo/verification rules. Forgot password redirects authenticated customers to My Bookings. Reset-password links retain their existing explicit token workflow, including session revocation and invalid/reused-token states. No authentication backend logic changed.

## 5. Admin Booking management

Rebuilt the screen inside the existing NeoTek CMS shell, with an aligned page header/reload action, compact search/status/date toolbar and a list/detail workspace. Native status selects were replaced with the existing CMS `SelectField` Radix component.

List rows show customer, company, solution, time and status. A restrained red edge and soft background identify the selected booking. Existing pagination remains. The detail panel groups appointment time, customer information, customer message, status transition, cancellation reason, activity timeline, internal notes and actual notification delivery summaries.

Status changes still submit `expectedVersion`; cancellation requires a reason; notes use the existing endpoint and CSRF token. No unsupported filter, action, meeting creation or invented outbox data was added. Stale detail responses are ignored and mutation clicks are serialized. On narrow screens, list and detail stack; selecting a booking focuses the detail panel and scrolls only the existing `.admin-main` content region, keeping the CMS header/navigation in place. Admin layout rules stay scoped to `.admin-bookings` and its components, without global layout/overflow changes. Booking copy supports VI/EN; the surrounding CMS navigation retains its existing Vietnamese copy.

## 6. Reused components and visual rules

Reused NeoTek color, type, spacing, radius and shadow tokens; `NeotekContainer`, `NeotekButton`, Navbar, Footer, Hugeicons in public scheduling, existing CMS buttons/SelectField, mini calendar, MonthCalendar, WeekCalendar, CustomerProvider and customer/admin API clients. Red is limited to primary actions, selection, focus and relevant status feedback; surfaces remain white and neutral gray. No new dependency, logo, font, design system or unrelated Home/Solutions/CMS redesign.

Radix usage: existing Dialog for the booking modal and mobile navigation; Select for solution and CMS status controls; Tabs for account booking periods; existing DropdownMenu for the account. Calendar view tabs and duration radios retain their existing keyboard behavior.

## 7. Files in this pass

- `src/pages/booking/BookingPage.jsx`, `BookingPage.css`, `BookingDialog.jsx`, `BookingModuleSelect.jsx`, `WeekCalendar.jsx`, `useBookingFlow.js`.
- `src/pages/account/MyBookings.jsx`, `my-bookings.css`.
- `src/admin/pages/BookingsManager.jsx`, new `bookings-manager.css`; removed obsolete booking rules from `src/admin/styles/admin.css`.
- `src/components/layout/NeotekNavbar/NeotekNavbar.jsx` (customer CTA destination).
- `src/components/common/SmoothScroll/SmoothScroll.jsx` (native scrolling for Booking, My Bookings and Admin Booking only).
- `src/pages/auth/CustomerAuthForm.jsx`, `PasswordRecovery.jsx` (customer route guards).
- `.gitignore`, this report and `docs/booking-ui-redesign-browser/results.json`.
- Backend checkout: only `scripts/check-booking-browser.cjs` changed, adapting and extending browser assertions. Pre-existing Phase 2B.1 source/config/migration changes were preserved.

## 8. Responsive and screen evidence

Target checks: VI/EN at 1440, 1280, 1024, 820 and 390, including Booking, hold modal, My Bookings populated/empty states, customer menu and auth forms; Admin Booking and existing CMS pages at all five widths. Assertions cover three-section support structure, desktop/mobile columns, absence of vertical timeline scrolling, horizontal overflow, focus containment/return and actual server interaction.

Local PNGs are intentionally ignored by git. Structured results are recorded separately. Evidence links are populated by the browser harness:

| Width | Booking | Modal | My Bookings | Admin Booking |
| --- | --- | --- | --- | --- |
| 1440 | [VI](booking-ui-redesign-browser/booking-vi-1440.png) | [VI](booking-ui-redesign-browser/hold-vi-1440.png) | [VI](booking-ui-redesign-browser/my-bookings-vi-1440.png) | [list/detail](booking-ui-redesign-browser/admin-booking-1440.png) |
| 1280 | [EN](booking-ui-redesign-browser/booking-en-1280.png) | [EN](booking-ui-redesign-browser/hold-en-1280.png) | [EN](booking-ui-redesign-browser/my-bookings-en-1280.png) | [list/detail](booking-ui-redesign-browser/admin-booking-1280.png) |
| 1024 | [VI](booking-ui-redesign-browser/booking-vi-1024.png) | [VI](booking-ui-redesign-browser/hold-vi-1024.png) | [VI](booking-ui-redesign-browser/my-bookings-vi-1024.png) | [list/detail](booking-ui-redesign-browser/admin-booking-1024.png) |
| 820 | [EN](booking-ui-redesign-browser/booking-en-820.png) | [EN](booking-ui-redesign-browser/hold-en-820.png) | [EN](booking-ui-redesign-browser/my-bookings-en-820.png) | [list](booking-ui-redesign-browser/admin-booking-820.png), [detail](booking-ui-redesign-browser/admin-booking-detail-820.png) |
| 390 | [VI](booking-ui-redesign-browser/booking-vi-390.png) | [VI](booking-ui-redesign-browser/hold-vi-390.png) | [VI](booking-ui-redesign-browser/my-bookings-vi-390.png) | [list](booking-ui-redesign-browser/admin-booking-390.png), [detail](booking-ui-redesign-browser/admin-booking-detail-390.png) |

Screen review confirmed compact weekly controls and aligned support sections at desktop/tablet widths, readable stacked day scheduling at 390 px, and account cards within the public site layout. The admin list/detail screens were inspected at 1440, 820 and 390 px; search text clears its icon and narrow-screen detail navigation keeps the CMS header visible. An additional [390 × 844 modal check](booking-ui-redesign-browser/hold-vi-390-844.png) confirms the contained modal scroll makes footer actions reachable by keyboard on a shorter mobile viewport. The two-column contact form becomes a single column on mobile.

## 9. Validation and limits

Frontend ESLint and the production build passed, with zero production source maps. Migration replay twice, the compiled production entry smoke and all 45 PostgreSQL integration cases passed. The final browser run passed all **260 recorded checks**, with **zero unhandled JavaScript exceptions**. Coverage includes direct slot opening, required solution selection, hold refresh/expiry/replacement/conflict/release, lost-response idempotent retry, one-action finalization with prefilled identity in both languages, account tabs, guest-route redirects, navbar keyboard/focus behavior, admin filters/status/cancellation/notes, recovery and responsive public/CMS regressions. Reproduction: build the frontend with process-local `VITE_API_BASE_URL=/api` for the harness proxy, then run `scripts/test-booking-postgres.ps1 -Browser -ProductionSmoke` from the backend (`-BrowserOnly` repeats browser coverage without rerunning the PostgreSQL test suites). The harness uses a disposable database, real namespaced Redis, explicit local dev mail and Chrome headless. Google fixture callbacks are spaced within the existing IP rate limit; security guards remain active. The two language fixtures finalize at distinct times on the shared disposable calendar. [Structured browser results](booking-ui-redesign-browser/results.json).

The GIS script/callback and backend Google-verifier boundary are mocked in deterministic browser checks; live Google sign-in is not manually retested. No production data mutation or deployment is part of this pass. No commit or push.
