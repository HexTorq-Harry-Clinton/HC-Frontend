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

export const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
