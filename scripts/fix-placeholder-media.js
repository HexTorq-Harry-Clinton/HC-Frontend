#!/usr/bin/env node
// Fix placeholder media that 404s on the live site.
// Rewrites cdn.example.com / dev.dine360.ca URLs to a working fallback
// via the live API (no direct DB needed). Safe to re-run — idempotent.

const API = "https://git-pipeline.metatronhost.in/hc/API/HARRY-CLINTON";
const EMAIL = process.env.HC_ADMIN_EMAIL || "akr.rajkumar@gmail.com";
const PASS = process.env.HC_ADMIN_PASS || "HarryClinton@2026";

// Working fallbacks — plain <img> (not next/image) so any https host is fine (CSP allows https).
const FALLBACKS = {
  slider: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=1600&q=80&auto=format&fit=crop",
  spotlight: [
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop",
  ],
  product: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80&auto=format&fit=crop",
  videoPoster: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1200&q=80&auto=format&fit=crop",
};

const isBad = (u) =>
  !u ||
  u.includes("cdn.example.com") ||
  u.includes("example.com") ||
  u.includes("dev.dine360.ca") ||
  u.includes("w3schools") ||
  u.includes("mov_bbb") ||
  u.includes("bunny");

async function api(path, opts = {}) {
  const url = API + path;
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${path} ${res.status} ${text.slice(0, 400)}`);
  return json;
}

function unwrap(res) {
  return res?.data?.data || res?.data || [];
}

async function login() {
  console.log(`Logging in as ${EMAIL}...`);
  const res = await api("/Auth/Password-Login", {
    method: "POST",
    body: JSON.stringify({ email_id: EMAIL, password: PASS }),
  });
  const token = res?.Response?.token || res?.data?.token || res?.token || res?.data?.data?.token;
  const user = res?.Response?.user || res?.data?.user || res?.user;
  if (!token) throw new Error("Login failed: no token in response " + JSON.stringify(res).slice(0, 600));
  console.log(`Logged in, user_id=${user?.user_id || "?"} role=${user?.roles?.[0]?.role_code || "?"}`);
  return token;
}

async function fixImageSliders(token) {
  const list = unwrap(await api("/Image-Sliders"));
  const bad = list.filter((r) => isBad(r.image_url));
  console.log(`\nImage-Sliders: ${list.length} total, ${bad.length} bad`);
  for (const r of bad) {
    const body = { image_slider_id: r.image_slider_id, image_url: FALLBACKS.slider, luu: "MIGRATION_FIX_PLACEHOLDER" };
    await api("/Image-Sliders", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    console.log(`  fixed ${r.image_slider_id} title="${r.title}"`);
  }
}

async function fixSpotlightMedia(token) {
  const list = unwrap(await api("/Spotlight-Media"));
  const bad = list.filter((r) => isBad(r.media_url));
  console.log(`\nSpotlight-Media: ${list.length} total, ${bad.length} bad`);
  for (let i = 0; i < bad.length; i++) {
    const r = bad[i];
    const fb = FALLBACKS.spotlight[i % FALLBACKS.spotlight.length];
    const body = { spotlight_media_id: r.spotlight_media_id, media_url: fb, luu: "MIGRATION_FIX_PLACEHOLDER" };
    await api("/Spotlight-Media", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    console.log(`  fixed ${r.spotlight_media_id}`);
  }
}

async function fixProductsMedia(token) {
  const list = unwrap(await api("/Products-Media"));
  const bad = list.filter((r) => isBad(r.media_url));
  console.log(`\nProducts-Media: ${list.length} total, ${bad.length} bad`);
  for (const r of bad) {
    const body = { product_media_id: r.product_media_id, media_url: FALLBACKS.product, luu: "MIGRATION_FIX_PLACEHOLDER" };
    await api("/Products-Media", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    console.log(`  fixed ${r.product_media_id} product=${r.product_id}`);
  }
}

async function fixMenuVideo(token) {
  const list = unwrap(await api("/Menu-Video"));
  const bad = list.filter((r) => isBad(r.video_url));
  console.log(`\nMenu-Video: ${list.length} total, ${bad.length} bad`);
  // Deactivate placeholder video rather than rewriting to a random unsplash mp4
  for (const r of bad) {
    const body = { menu_video_id: r.menu_video_id, isactive: 0, luu: "MIGRATION_FIX_PLACEHOLDER" };
    await api("/Menu-Video", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    console.log(`  deactivated ${r.menu_video_id}`);
  }
}

(async () => {
  const token = await login();
  await fixImageSliders(token);
  await fixSpotlightMedia(token);
  await fixProductsMedia(token);
  await fixMenuVideo(token);
  console.log("\nDone. Revalidating storefront...");
  try {
    await fetch("https://hc-frontend-seven.vercel.app/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "hc-revalidate-2026" }),
    });
    console.log("Revalidate triggered.");
  } catch {}
})();
