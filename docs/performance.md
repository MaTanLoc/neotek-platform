# Homepage performance

## Frontend implemented

- `getHomepageData(language)` caches the normalized homepage per language and deduplicates pending calls. TTL is 5 seconds in development and 60 seconds in production. Collection cache uses the same TTL so it does not mask development edits.
- `getCachedHomepageData(language)` supports an immediate render on a warm homepage mount. Language changes retain the current CMS content while the new language loads; a failed refresh retains the last successful content.
- `clearHomepageCache()` and `clearWordPressCache()` clear both cache layers. They do not abort pending requests, but those requests cannot restore a cache cleared during their flight.
- The first hero image uses eager loading and high fetch priority; other hero images use lazy loading. React 18 receives lowercase `fetchpriority` to avoid its unknown camelCase prop warning. Responsive `<picture>` sources remain in place.
- `optimizeCloudinaryImage()` optimizes unsigned, untransformed `res.cloudinary.com/.../image/upload/` URLs with `c_limit,w_1920/q_auto/f_auto` (900 for the mobile source). Signed URLs, existing transformations, query/hash URLs, GIFs, SVGs and other hosts are preserved. Restricted Cloudinary transformation policies must allow these variants.
- Below-fold images use lazy loading and async decoding. CSS background images are unchanged.
- Home, Solutions, Booking, Login and Register use route-level dynamic imports, including their existing English routes and homepage fallback. Suspense has no spinner. Smooth-scroll route synchronization commits with the route content after its chunk loads.
- GSAP remains in the app entry because the existing global SmoothScroll uses it. Motion and Embla move into route dependencies. Adding lazy wrappers to below-fold sections would not remove these dependencies from homepage loading because Hero/Why already use them.

Cold homepage: 9 parallel WordPress collection requests. A valid normalized homepage cache: 0 requests. Switching to another uncached language may also need 0 network requests while the shared collection cache is valid; normalization still runs once for that language. Expired or manually cleared caches request fresh collections. No HTTP response cache headers are set by the frontend.

REST requests keep `acf_format=standard` and `_fields=id,title,content,acf`. Hero requests only `id,acf`, which its normalizer consumes. Language and active-state filtering remain as implemented; no unverified WordPress language query parameter is introduced.

## Proposed WordPress endpoint (not implemented)

This checkout contains the frontend and no WordPress PHP, custom plugin or theme. Locate the deployed WordPress checkout before implementing a backend. Proposed standalone plugin:

```text
wp-content/plugins/neotek-api/neotek-api.php
```

Register a public, read-only `GET /wp-json/neotek/v1/homepage?lang=vi` endpoint, supporting `vi` and `en`. Validate the language against that allowlist. Return the same normalized contract as the current frontend, not raw private ACF data:

```json
{
  "heroSlides": [],
  "whyItems": [],
  "solutionClusters": [],
  "proofMetrics": [],
  "trustedLogos": [],
  "testimonials": [],
  "ctaSection": null,
  "faqs": []
}
```

Match current active filtering, language filtering, display order, text normalization, numeric/boolean conversion, logo filtering and modules merged into their clusters. Whitelist only fields used by the frontend. Preserve FAQ answer HTML with appropriate WordPress sanitization. Confirm the CPT registrations, ACF field names and language storage in the real backend before writing its queries.

Cache the public normalized response in WordPress per language, for example `neotek_homepage_vi` and `neotek_homepage_en`, with a 60-second TTL. Invalidate both on relevant content/ACF changes, including unpublish and delete; avoid invalidating recursively from read requests. An empty valid homepage is distinct from a database/error response.

Only after confirming that the response contains exclusively public content, consider:

```http
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

An ETag or Last-Modified can support conditional browser requests. CDN/Cloudflare cache keys must include `lang`; bypass requests with Authorization or authenticated WordPress cookies, and do not cache errors or private responses. Configure CORS for the real frontend origin if required. Use backend/CDN configuration for headers, not JavaScript request headers.

Once deployed and verified, replace the internal `loadHomepageData()` collection aggregator with this endpoint without changing `getHomepageData()` or component props. Verify both language contracts before enabling it. This changes the cold homepage from 9 requests to 1.

## Production follow-up

1. Implement and validate the public WordPress plugin in its actual repository, then enable the single endpoint.
2. Verify transformed hero URLs against the actual Cloudinary account and measure desktop/mobile image bytes and LCP with real CMS data.
3. Configure compression and immutable caching for hashed Vite assets; use revalidation for HTML and an SPA rewrite for deep links such as `/en/booking`.
4. Measure homepage LCP, CLS, INP and transferred route dependencies on a production-like connection. Do not infer real-user performance from bundle size alone.
5. Keep global GSAP behavior intact unless a separate scope permits changing SmoothScroll.

Cloudinary transformation syntax: https://cloudinary.com/documentation/image_optimization
