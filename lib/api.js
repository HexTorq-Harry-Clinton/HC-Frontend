// Central API layer for the Harry Clinton storefront (plain JS).
// Server Components use apiGet() (fresh by default on Next 16 — no stale catalog).
// Client Components use apiFetch() which attaches the hc_token automatically.
//
// LIVE BACKEND (VPS, auto-deploys on push) — hardcoded by design so the app
// works with zero env declaration. Never point this at localhost.
export const API_BASE_URL = "https://git-pipeline.metatronhost.in/hc/API/HARRY-CLINTON";

// Backend serves uploaded files from its own origin (/Uploads), NOT under /API/*.
export const UPLOAD_ORIGIN = API_BASE_URL.replace(/\/API\/.*$/i, "");

export const unwrap = (res) => res?.data?.data || res?.data || [];

// ---- server-side GET (Server Components, generateMetadata, etc.) ----
// The live backend can be slow under load (large media uploads block it),
// so a single flaky/aborted fetch used to zero out whole catalog bundles and
// take pages down. One automatic retry covers transient slowness.
export async function apiGet(path, { params, revalidate, timeout = 8000 } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== null) url.searchParams.set(k, v);
    }
  }
  const run = async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        // revalidate: 0 must stay "always fresh" — a truthiness check would
        // silently coerce it back to 60 and serve stale catalog data.
        ...(revalidate !== undefined ? { next: { revalidate } } : { next: { revalidate: 60 } }),
      });
      if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
      return res.json();
    } finally {
      clearTimeout(t);
    }
  };
  try {
    return await run();
  } catch (e) {
    // One retry — covers a slow/aborted first attempt on cold backend connections.
    return await run();
  }
}

// ---- client-side request (attaches JWT, same 401 behaviour as the old app) ----
export async function apiFetch(path, { method = "GET", body, params } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== null) url.searchParams.set(k, v);
    }
  }
  const token =
    typeof window !== "undefined" ? localStorage.getItem("hc_token") : null;
  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("hc_token");
    localStorage.removeItem("hc_user");
    // Let the AuthListener island perform router navigation (this lib has no router).
    window.dispatchEvent(new CustomEvent("hc:unauthorized"));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `API ${path} failed: ${res.status}`);
  }
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON 200 (proxy error page, empty body) — never crash callers.
    return {};
  }
}

// Turns whatever the backend hands back (~/Uploads/..., /Uploads/..., absolute,
// data:, blob:) into a URL the browser can load.
export function resolveUploadUrl(value) {
  if (!value) return value;
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  if (value.startsWith("~/")) return `${UPLOAD_ORIGIN}/${value.slice(2)}`;
  if (value.startsWith("~")) return `${UPLOAD_ORIGIN}${value.slice(1)}`;
  if (value.startsWith("/")) return `${UPLOAD_ORIGIN}${value}`;
  return value;
}

// File → "image" | "video" by MIME, falling back to extension.
// Single source of truth for every admin media field (no manual picking).
export function detectMediaType(file) {
  const mime = (file?.type || "").toLowerCase();
  if (mime.startsWith("video")) return "video";
  if (mime.startsWith("image")) return "image";
  const name = (file?.name || "").toLowerCase();
  if (/\.(mp4|webm|mov|avi|mkv)$/.test(name)) return "video";
  return "image";
}

// POST a File to /FileUpload with LIVE progress via XHR (fetch has no upload
// progress events). onProgress gets { loaded, total, percent, speedBps,
// etaSecs, name } on every tick. Resolves with the stored path, same as
// uploadFile. Used by every admin upload so the ring shows uploaded bytes,
// remaining, ETA and live percentage.
export function uploadFileWithProgress(file, { path, onProgress } = {}) {
  if (!file) return Promise.reject(new Error("No file selected."));
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    if (path) fd.append("path", path);
    const token = typeof window !== "undefined" ? localStorage.getItem("hc_token") : null;
    const xhr = new XMLHttpRequest();
    const total = file.size || 0;
    const started = Date.now();
    let lastTick = started;
    let lastLoaded = 0;
    let smoothBps = 0;
    xhr.upload.onprogress = (e) => {
      const loaded = e.loaded || 0;
      const now = Date.now();
      const dt = Math.max(1, now - lastTick) / 1000;
      const instant = Math.max(0, (loaded - lastLoaded) / dt);
      // exponential smoothing keeps speed/ETA readable, still lively
      smoothBps = smoothBps === 0 ? instant : smoothBps * 0.7 + instant * 0.3;
      lastTick = now;
      lastLoaded = loaded;
      const percent = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
      const remaining = Math.max(0, total - loaded);
      const etaSecs = smoothBps > 0 ? remaining / smoothBps : null;
      try {
        onProgress?.({ loaded, total, percent, speedBps: smoothBps, etaSecs, name: file.name });
      } catch {
        /* never break the upload for a UI callback */
      }
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        data = {};
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(data?.message || `Upload failed (${xhr.status}).`));
        return;
      }
      const url = data?.data?.virtualPath || data?.virtualPath || data?.data?.url || data?.url;
      if (!url) {
        reject(new Error("Upload did not return a URL."));
        return;
      }
      try {
        onProgress?.({ loaded: total, total, percent: 100, speedBps: smoothBps, etaSecs: 0, name: file.name });
      } catch {
        /* ignore */
      }
      resolve(url);
    };
    xhr.onerror = () => reject(new Error("Upload failed — check connection."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.open("POST", `${API_BASE_URL}/FileUpload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(fd);
  });
}

// POST a File to /FileUpload, resolve with the stored path.
// Used by the single-submit admin flow: staged on pick, uploaded on Submit.
export async function uploadFile(file, { path } = {}) {
  if (!file) throw new Error("No file selected.");
  const fd = new FormData();
  fd.append("file", file);
  if (path) fd.append("path", path);
  const token = typeof window !== "undefined" ? localStorage.getItem("hc_token") : null;
  const res = await fetch(`${API_BASE_URL}/FileUpload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  const url = data?.data?.virtualPath || data?.virtualPath || data?.data?.url || data?.url;
  if (!url) throw new Error("Upload did not return a URL.");
  return url;
}

// Newsletter subscribe with graceful duplicate handling.
// - Checks the live list first, so an email subscribed on ANY device/browser
//   gets "already subscribed" instead of a raw database error.
// - 409s / unique-index errors from the server map to the same message.
// - Never surfaces raw SQL/DB text to the user.
export async function subscribeNewsletter(email) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("Please enter a valid email.");
  }
  try {
    const list = unwrap(await apiFetch("/Newsletter-Subscriptions"));
    const found = (Array.isArray(list) ? list : []).find(
      (s) => (s.emailid || s.email_id || s.email || "").toLowerCase() === normalized
    );
    if (found && (found.subscription_status || "subscribed") !== "unsubscribed" && found.isactive !== 0 && found.isactive !== false) {
      const err = new Error("This email is already subscribed.");
      err.code = "ALREADY_SUBSCRIBED";
      throw err;
    }
  } catch (e) {
    if (e.code === "ALREADY_SUBSCRIBED") throw e;
    // list fetch failed — fall through to POST and let the server decide
  }
  try {
    await apiFetch("/Newsletter-Subscriptions", {
      method: "POST",
      body: { emailid: normalized, subscription_status: "subscribed", rcu: "website" },
    });
    return { subscribed: true };
  } catch (e) {
    const raw = e.message || "";
    if (/duplicate|already|unique index|ux_tbl_newsletter/i.test(raw)) {
      throw new Error("This email is already subscribed.");
    }
    throw new Error("Subscription failed. Please try again.");
  }
}

// ---- cached GET: fetch once per session, never refetch on back-nav ----
// Homepage sections mount fresh on every visit — without this, going to a
// page and back re-fires every API and re-downloads every asset. apiCached
// returns UNWRAPPED data and shares it three ways:
//  1. in-memory map (instant, survives SPA navigation),
//  2. sessionStorage (survives full refresh, dies with the tab),
//  3. in-flight coalescing (7 components asking /Settings at once = 1 call).
// Admin mutations call revalidateSite() which busts the cache instantly.
const API_CACHE_TTL = 10 * 60 * 1000;
const apiMemCache = new Map();
const apiFlights = new Map();
const apiCacheKey = (path, params) => `${path}?${JSON.stringify(params || {})}`;

function readSessionCache(key) {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(`hc_api_${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || Date.now() - entry.at > API_CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeSessionCache(key, data) {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(`hc_api_${key}`, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota or private mode — memory cache still covers the session */
  }
}

export function clearApiCache() {
  apiMemCache.clear();
  try {
    if (typeof window !== "undefined") {
      const drop = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith("hc_api_")) drop.push(k);
      }
      drop.forEach((k) => window.sessionStorage.removeItem(k));
    }
  } catch {
    /* ignore */
  }
}

export async function apiCached(path, { params, ttl = API_CACHE_TTL } = {}) {
  const key = apiCacheKey(path, params);
  const now = Date.now();
  const mem = apiMemCache.get(key);
  if (mem && now - mem.at < ttl) return mem.data;
  const sess = readSessionCache(key);
  if (sess !== null && sess !== undefined) {
    apiMemCache.set(key, { at: now, data: sess });
    return sess;
  }
  if (apiFlights.has(key)) return apiFlights.get(key);
  const flight = apiFetch(path, { params })
    .then(unwrap)
    .then((data) => {
      apiMemCache.set(key, { at: Date.now(), data });
      writeSessionCache(key, data);
      return data;
    })
    .finally(() => {
      apiFlights.delete(key);
    });
  apiFlights.set(key, flight);
  return flight;
}

// Best-effort image precache into the browser Cache Storage (IMAGES ONLY —
// videos stream with range requests, which a stored opaque copy would break).
// Failures (quota, CORS, private mode) are swallowed: the <img> still loads
// normally. Fire-and-forget — never await this.
export function precacheMedia(urls) {
  try {
    if (typeof window === "undefined" || !("caches" in window)) return;
    const list = [...new Set((Array.isArray(urls) ? urls : []).filter(Boolean))]
      .filter((u) => !/^(blob:|data:)/i.test(u) && !/\.(mp4|webm|mov)(\?|#|$)/i.test(u))
      .slice(0, 24);
    if (list.length === 0) return;
    window.caches
      .open("hc-media-v1")
      .then((cache) =>
        cache.keys().then((keys) => {
          const have = new Set(keys.map((r) => r.url));
          list.forEach((u) => {
            let abs = u;
            try {
              abs = new URL(u, window.location.origin).toString();
            } catch {
              /* keep raw */
            }
            if (have.has(abs)) return;
            fetch(u, { mode: "no-cors" })
              .then((res) => cache.put(u, res).catch(() => {}))
              .catch(() => {});
          });
        })
      )
      .catch(() => {});
  } catch {
    /* never break rendering for a cache hint */
  }
}

// Ask Next.js to revalidate all public pages immediately (fire-and-forget).
// Called by admin screens after successful mutations.
export async function revalidateSite() {
  // Bust the session API cache too, so the next visit fetches fresh rows.
  clearApiCache();
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "hc-revalidate-2026" }),
    });
  } catch {
    /* revalidation is best-effort; pages still refresh on revalidate window */
  }
}

// Session helpers — single source of truth for the logged-in identity.
// DB truth: tbl_users PK is `user_id`; the auth envelope stores the user row
// (plus role/role_code) as hc_user. No `user.id` guessing anywhere.
export function currentUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("hc_user") || "null");
  } catch {
    return null;
  }
}

export function currentUserId() {
  const user = currentUser();
  return user?.user_id || null;
}

// Extract a human message from backend errors. The API often returns a JSON
// blob as the error text ({"success":false,"message":"..."} ) — surface the
// inner message, and translate common DB errors into plain language.
// Never show raw SQL to users.
export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  const raw = err?.message || err || "";
  let message = "";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    message = parsed?.message || parsed?.Message || "";
  } catch {
    message = typeof raw === "string" ? raw : "";
  }
  if (!message) return fallback;
  if (/unique index|duplicate key|ux_tbl_/i.test(message)) {
    const slug = message.match(/\(([^)]+)\)\s*$/);
    if (/slug/i.test(message)) {
      return `That slug${slug ? ` (${slug[1]})` : ""} is already used. Please change the slug.`;
    }
    // Never leak internal table/index names — plain language only.
    return "This record already exists. Please change the unique value.";
  }
  if (/FOREIGN KEY/i.test(message)) {
    return "Related record not found. Please pick from the dropdown.";
  }
  if (/CHECK constraint|conflicted with the CHECK/i.test(message)) {
    return "One of the values is not allowed. Please check the form.";
  }
  // Strip any remaining SQL noise; cap length.
  return message.length > 220 ? message.substring(0, 220) + "…" : message;
}

export const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
