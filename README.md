# HC Frontend v2 — Harry Clinton Storefront (Next.js)

Complete rewrite of the Harry Clinton clothing e-commerce frontend.

## Stack

- **Next.js 16** (App Router) + **React 19** — SSR/SSG for SEO, dynamic admin
- **Tailwind CSS 4** — utility styling, Playfair Display + Inter via `next/font`
- **Framer Motion** — scroll reveals, card motion
- **Lenis** — smooth scrolling
- **GSAP + ScrollTrigger** — hero entrance + parallax
- Plain **JavaScript** (no TypeScript), ESLint

## Getting started

```bash
npm install
npm run dev                  # http://localhost:3000
```

Live backend (VPS, auto-deploys on push) is hardcoded in `lib/api.js` —
`https://git-pipeline.metatronhost.in/hc/API/HARRY-CLINTON` — so the app works
with zero env declaration. Both Vercel (frontend) and VPS (backend) redeploy
on push to `main`; always verify against the live API, never localhost.

```bash
npm run build   # 79 static pages prerendered + dynamic admin
npm start
```

## Architecture

- `lib/api.js` — fetch layer (server `apiGet`, client `apiFetch` with `hc_token`, `resolveUploadUrl`, `inr`)
- `lib/catalog.js` — single route registry: categories, occasions, collections, static pages
- `lib/shop.js` — server data helpers (category feeds, product detail, home)
- `app/(store)/page.js` — home (SSG, live sliders/spotlight/collections/FAQs)
- `app/(store)/[...slug]/page.js` — ONE parametric router for all 50+ legacy URLs
  (categories, occasions, collections, `product/:id`, static pages) with per-page SEO metadata
- `app/(store)/cart|checkout|wishlist|search|login|register|profile|orders|...` — commerce + account
- `app/admin/` — JWT-guarded shell, dashboard, product CRUD, order fulfilment, generic module viewer
- `components/` — Header/Footer/RunningBar (server), ProductCard/CategoryView/Hero/Reveal (motion islands)

## Notes

- No hardcoded catalog anywhere — empty API means honest empty states, never fake products.
- Product media resolves `~/Uploads/...` to absolute backend URLs; missing images use a local SVG placeholder.
- Category filtering is keyword-based until the backend adds a category FK on products.

## Identity contract (auth)

- Backend `tbl_users` PK is `user_id`; the login envelope returns the user row
  under `Response.user` with `Response.roles[]` and `Response.token`.
- `saveSession()` (`app/(store)/auth.jsx`) persists `hc_token`, `hc_session="1"`,
  `hc_user` (row + `role`/`role_code`), and `hc_role` (primary `role_code`).
- All account pages read identity ONLY via `currentUser()` / `currentUserId()`
  in `lib/api.js`. Never add `user.id` / `uid` / `customerId` fallbacks —
  a mismatch must surface as logged-out, not as leaked rows.

## Publishing (ISR)

- Public pages prerender with `revalidate=300` as a fallback safety net.
- Every admin mutation calls `revalidateSite()` → `POST /api/revalidate`
  (secret-guarded), which purges the full public cache via
  `revalidatePath("/", "layout")` — edits go live instantly.
