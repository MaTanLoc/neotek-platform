# NeoTek Frontend Stack Contract

## 1. Core libraries

This project is intentionally structured as a React 18 + Vite application that preserves the existing NeoTek design system and architecture while preparing for a production-grade booking platform.

| Library | Version | Purpose |
| --- | --- | --- |
| react | 18.3.1 | Current application runtime. Keep React 18 for compatibility with the repository. |
| react-dom | 18.3.1 | DOM rendering for the React 18 app. |
| vite | 5.4.14 | Build tooling and local dev server. |
| @vitejs/plugin-react | 4.3.4 | Vite React integration. |
| react-router | 7.18.4 | Future page routing and navigation shell. |
| @tanstack/react-query | 5.103.1 | Server state caching and synchronization for booking APIs. |
| @fullcalendar/react | 7.1.0 | Calendar UI layer. |
| @fullcalendar/interaction | 6.1.21 | Date selection, drag/drop, resize behavior. |
| @fullcalendar/daygrid | 6.1.21 | Month view. |
| @fullcalendar/timegrid | 6.1.21 | Week/day scheduling views. |
| @fullcalendar/list | 6.1.21 | Agenda/list view. |
| react-hook-form | 7.88.0 | Form state management for booking and lead forms. |
| @hookform/resolvers | 5.9.1 | Schema validation integration for RHF + Zod. |
| zod | 3.25.76 | Runtime validation and form schema rules. |
| radix-ui | 1.6.7 | Accessible dialog, menu, popover, tooltip, tabs, and similar primitive behavior. |
| motion | 13.4.0 | Meaningful UI transitions and dialog/interaction motion. |
| embla-carousel-react | 8.6.0 | Carousel engine. |
| embla-carousel-autoplay | 8.6.0 | Autoplay support for future hero or feature carousels. |
| lucide-react | 1.47.0 | Lightweight icon set for UI actions and status indicators. |
| date-fns | 4.4.0 | Lightweight date arithmetic and formatting utilities. |

## 2. Libraries intentionally not installed yet

These were explicitly excluded because they are not required for the current infrastructure phase or would introduce unnecessary complexity:

- @fullcalendar/react-scheduler
- @tanstack/react-table
- recharts
- zustand
- sonner
- assistant-ui
- AI SDK
- analytics SDKs
- payment SDKs
- CMS SDKs
- Redux
- Moment.js
- Tailwind
- MUI, Ant Design, Chakra, Bootstrap

The project deliberately avoids a large component framework or state-management migration in this phase.

## 3. State management rules

The frontend will follow a clear separation of concerns:

- React state: local UI state, transient interaction state, component-level controls.
- React Hook Form + Zod: form state, validation, and submission payloads.
- TanStack Query: server data, API cache, mutation orchestration, and invalidation.
- FullCalendar: UI-only presentation and interaction layer for calendar operations.
- Zustand: only for genuine cross-feature client state if a future requirement clearly justifies it; not for server data models.

Important rule: FullCalendar is not the source of truth for booking data. The backend/API remains the source of truth.

## 4. Calendar / booking architecture

The booking layer is being prepared as an Outlook-style scheduling experience, but the actual booking UI is not implemented in this step.

The future architecture must support:

- month view
- week view
- day view
- agenda/list view
- time-slot selection
- date range selection
- booking creation and editing
- drag/drop scheduling
- resize scheduling
- event selection
- business-hours highlighting
- keyboard support where available
- responsive behavior
- localization
- timezone-aware handling

The intended architecture is:

1. FullCalendar renders the calendar and handles interaction.
2. TanStack Query owns the API-managed booking state and cache.
3. React Hook Form + Zod validates booking form payloads.
4. Radix Dialog / Popover / Menu provides accessible create/edit detail UI.
5. Motion handles subtle transitions only when they improve clarity.
6. date-fns supports client-side date utilities when needed.

This separation must stay intact for future implementation.

## 5. FullCalendar architecture

FullCalendar is a confirmed platform requirement because booking is a product need, not an optional enhancement.

The plan is to use the current modern package layout compatible with React 18:

- @fullcalendar/react
- @fullcalendar/interaction
- @fullcalendar/daygrid
- @fullcalendar/timegrid
- @fullcalendar/list

The app must remain ready for:

- navigation controls (today / previous / next)
- view toggles (month / week / day / list)
- selection of time ranges
- editable event payloads
- event drag and resize
- optimistic UI updates only when appropriate
- rollback and error recovery on failed server mutations

Future event mutation flow:

1. FullCalendar updates the visual event state.
2. Frontend sends a backend mutation/update.
3. On success, invalidates or refreshes the relevant TanStack Query cache.
4. On failure, reverts the event to its previous date/time and surfaces an accessible error notification.

This pattern prevents the UI and backend from diverging silently.

## 6. Timezone requirements

Booking is time-sensitive and cannot be treated as a simple local-string field. The future architecture must explicitly handle:

- timezone
- locale
- ISO timestamps
- daylight-saving transitions
- canonical backend time representations
- browser-local display time

Required future rule: convert and store timestamps in a canonical backend-safe format, then render in the user’s local timezone for display when appropriate. Do not treat booking start/end times as arbitrary local strings.

## 7. Calendar data model

The final backend schema is not being invented in this task. However, the frontend must be prepared for a normalized booking model with concepts such as:

- bookingId
- title
- start
- end
- timezone
- status
- customerContact
- bookingType
- description
- createdAt
- updatedAt

This model is architectural guidance only and must not be treated as an existing API contract without verification.

## 8. Resource scheduling decision point

Premium FullCalendar Scheduler is not installed at this time. Future resource scheduling may be required for:

- meeting rooms
- consultants
- employees
- services or resources
- equipment
- multiple calendars or resource lanes

The project should revisit the Premium Scheduler decision only when NeoTek confirms resource-based scheduling is required. At present the architecture is kept intentionally lighter than premium scheduling.

## 9. Form architecture

Forms will use React Hook Form + Zod as the default stack for:

- demo requests
- contact requests
- booking creation/editing
- support requests
- login/register flows if introduced later

This keeps validation, schema rules, and submission behavior consistent across the site.

## 10. Carousel architecture

Embla is the approved carousel engine for future marketing and product storytelling use cases.

Future carousel requirements:

- swipe / touch support
- keyboard navigation
- pagination
- autoplay
- pause on interaction
- reduced-motion awareness
- responsive behavior
- slide-specific content and CTA

The carousel is not implemented in this task, but the architecture is ready when the next website build phase begins.

## 11. Animation rules

Motion is approved for meaningful transitions only.

Use motion for:

- section entrances
- modal transitions
- carousel transitions
- subtle layout transitions
- interaction feedback where clarity improves

Avoid:

- excessive bounce
- constant animation
- aggressive parallax
- distracting or decorative movement
- animation that competes with the business content

The app must respect prefers-reduced-motion behavior and prefer simple CSS transitions for lightweight hover/focus actions.

## 12. Accessibility rules

Production UI must support:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- screen-reader-friendly dialogs
- accessible form errors
- correct heading hierarchy
- strong color contrast
- touch-friendly controls
- reduced-motion support

Calendar interactions must not rely solely on mouse input. The booking layer must continue to support keyboard and assistive technology patterns when implemented.

## 13. Routing rules

The project is prepared to use react-router for future routes such as:

- marketing pages
- product pages
- resources pages
- booking pages
- contact/demo pages

No routing architecture migration is being forced in this step. The app remains minimally structured while the foundation is installed and documented.

## 14. Design system compatibility

The project must remain aligned with the existing NeoTek design system:

- NeoTek tokens remain the source of truth
- existing CSS architecture remains the base styling layer
- Radix is used only for behavior/accessibility primitives
- visual styling continues to use the current design tokens and component structure

This keeps the design system stable while preparing the booking system.

## 15. Future Premium Scheduler decision point

Premium Scheduler may be introduced later if NeoTek requires:

- resource timelines
- room allocation
- staff scheduling
- multiple calendars/resources
- advanced enterprise scheduling views

This decision should be revisited only after business requirements are confirmed. For now, the standard FullCalendar stack is the correct production baseline.

## 16. Implementation guardrails for the next phase

This task is infrastructure only. The next phase should implement website sections on top of this foundation without changing:

- React 18
- Vite version
- the existing CSS architecture
- the NeoTek design tokens
- the current project structure
- the allowed library set for the current phase

No fake booking data, fake API responses, or placeholder product claims are to be introduced into the frontend codebase during this foundation pass.
