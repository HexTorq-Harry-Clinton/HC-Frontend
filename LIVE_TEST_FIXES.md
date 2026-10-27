# Live Visual Test Fixes

Date: 27 October 2026

## Findings and fixes

### 1. 88 Cigarettes returned 404

The storefront uses `/cigarettes` internally, while the admin collection record and public link use `/88-cigarettes`.

**Fix:** `/88-cigarettes` is now a supported alias for the canonical Cigarettes collection. Both URLs resolve to the same collection page, and the alias is included in prerendered storefront paths and breadcrumbs.

### 2. Style By HC and Collection Pages were mixed in the admin navigation

Both records previously used the same admin route. The admin registry now separates them:

- `/admin/style-collections` — the five routed collection pages
- `/admin/style-by-hc` — the homepage Style By HC records

The sidebar uses the separate Style By HC route, and both screens continue reading the shared legacy backend table without changing production records.

### 3. Existing order displayed a zero total

One legacy order returned zero-valued stored totals even though its order items had prices. The customer order page now calculates a safe display fallback from item prices, shipping, tax, and discount whenever the stored total is missing or zero. It does not modify the order in the backend.

### 4. Cloudflare Insights was blocked by CSP

The production CSP now permits the Cloudflare Insights script and telemetry endpoints, removing the browser CSP warning while retaining the existing restrictive policy.

## Verification target

After deployment, verify:

- `https://www.harryclinton.in/88-cigarettes`
- `https://www.harryclinton.in/cigarettes`
- `https://www.harryclinton.in/admin/style-collections`
- `https://www.harryclinton.in/admin/style-by-hc`
- The signed-in customer `/orders` page shows a non-zero fallback total for the affected legacy order.

## Local validation

- Targeted ESLint passed.
- `npm run build` passed with Next.js 16.3.4.
- No production records were edited during the fix.

## Admin panel audit fixes

The admin audit also addressed:

- Duplicate sidebar destinations and conflicting active selections.
- Missing direct links for category/product maintenance modules.
- Mobile sidebar backdrop, Escape handling, and keyboard focus states.
- Protected/read-only modules exposing bulk-delete controls.
- Generic delete/toggle failures falsely showing success.
- Subcategory content deletion using its required `/:id` URL.
- String select options, string boolean values, and date edit values.
- Nested workspace pagination reset when the parent changes.
- Accessible search labels and CRUD dialog semantics.
- Appointment status values aligned with backend values.
- Appointment cancellation changed from destructive delete to a cancelled status update.
- Product delete/toggle failures now show an error instead of silently continuing.
- Multipart upload field order corrected; backend uploads now require admin auth and validate size, MIME type, and extensions.

## Workflow, media, and responsive pass

- Customer appointment date/time filters now consistently handle boolean values returned as booleans, numbers, or strings, exclude booked slots, submit the canonical `requested` status, and cancel through a non-destructive status update.
- Admin order status updates now fail visibly when a status-master record is unavailable; order totals use stored values when valid and safe item/tax/shipping/discount fallbacks otherwise.
- Order detail tabs now expose tab semantics and remain horizontally usable on narrow screens; long order/customer headers wrap without forcing page overflow.
- Shared confirmation dialogs close with Escape, expose dialog semantics, and move focus into the dialog. Admin overlays lock body scrolling and product workspace forms also close with Escape.
- Product and editorial media previews now render video files as video rather than broken image elements; inactive or unavailable media remains excluded from storefront showcases.
- Catalog and admin product loading follows explicit backend pagination metadata without repeatedly fetching non-paginated endpoints.
- Numeric generic admin fields are validated and normalized before submission.

## Verification

- Targeted ESLint: passed with no warnings on changed files.
- Full ESLint: passed with existing warnings only; no errors.
- `npm run build`: passed with Next.js 16.3.4.
- Live desktop smoke check: `/book-appointment` loaded successfully with no browser console errors; no appointment or order mutation was submitted.
- Homepage splash session-state hydration was corrected after the final live pass exposed React hydration warning `#418`; the session-storage check now runs asynchronously after the matching server/client render.
- Authentication/authorization and IDOR findings remain intentionally out of scope.
