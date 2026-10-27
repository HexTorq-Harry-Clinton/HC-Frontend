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
