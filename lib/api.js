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
export async function apiGet(path, { params, revalidate } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== null) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
    ...(revalidate ? { next: { revalidate } } : {}),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
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
  return text ? JSON.parse(text) : {};
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

// Ask Next.js to revalidate all public pages immediately (fire-and-forget).
// Called by admin screens after successful mutations.
export async function revalidateSite() {
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
    const what = message.match(/object 'dbo\.(\w+)'/);
    if (/slug/i.test(message)) {
      return `That slug${slug ? ` (${slug[1]})` : ""} is already used. Please change the slug.`;
    }
    return `This ${what ? what[1].replace(/^tbl_/, "").replace(/_/g, " ") : "record"} already exists. Please change the unique value.`;
  }
  if (/FOREIGN KEY/i.test(message)) {
    const tbl = message.match(/table "dbo\.(\w+)"/);
    return `Related record not found${tbl ? ` (missing in ${tbl[1]})` : ""}. Please pick from the dropdown.`;
  }
  if (/CHECK constraint|conflicted with the CHECK/i.test(message)) {
    return "One of the values is not allowed. Please check the form.";
  }
  // Strip any remaining SQL noise; cap length.
  return message.length > 220 ? message.substring(0, 220) + "…" : message;
}

export const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
