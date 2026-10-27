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
