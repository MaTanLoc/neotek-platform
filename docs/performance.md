# Homepage performance

## Frontend implemented

- `getHomepageData(language)` loads the normalized page from the NestJS backend API.
- `getCachedHomepageData(language)` returns no frontend cache; backend Redis caching remains authoritative.
- Public Home and Solutions content is loaded from the NestJS backend API through `contentService` and `backendApiAdapter`. The backend owns content caching.
- The first hero image uses eager loading and high fetch priority; other hero images use lazy loading. React 18 receives lowercase `fetchpriority` to avoid its unknown camelCase prop warning. Responsive `<picture>` sources remain in place.
- `optimizeCloudinaryImage()` optimizes unsigned, untransformed `res.cloudinary.com/.../image/upload/` URLs with `c_limit,w_1920/q_auto/f_auto` (900 for the mobile source). Signed URLs, existing transformations, query/hash URLs, GIFs, SVGs and other hosts are preserved. Restricted Cloudinary transformation policies must allow these variants.
- Below-fold images use lazy loading and async decoding. CSS background images are unchanged.
- Home, Solutions, Booking, Login and Register use route-level dynamic imports, including their existing English routes and homepage fallback. Suspense has no spinner. Smooth-scroll route synchronization commits with the route content after its chunk loads.
- GSAP remains in the app entry because the existing global SmoothScroll uses it. Motion and Embla move into route dependencies. Adding lazy wrappers to below-fold sections would not remove these dependencies from homepage loading because Hero/Why already use them.

Each public page request targets `/api/pages/:slug?locale=:locale`; there is no frontend WordPress request or fallback. The adapter normalizes the backend response into the existing component contract without adding a client cache.

## Production follow-up

1. Verify transformed hero URLs against the actual Cloudinary account and measure desktop/mobile image bytes and LCP with real CMS data.
2. Configure compression and immutable caching for hashed Vite assets; use revalidation for HTML and an SPA rewrite for deep links such as `/en/booking`.
3. Measure homepage LCP, CLS, INP and transferred route dependencies on a production-like connection. Do not infer real-user performance from bundle size alone.
4. Keep global GSAP behavior intact unless a separate scope permits changing SmoothScroll.

Cloudinary transformation syntax: https://cloudinary.com/documentation/image_optimization
