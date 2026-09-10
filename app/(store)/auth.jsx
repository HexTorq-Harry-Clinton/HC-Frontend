"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{label}</span>
      <input {...props} className="mt-1 w-full border border-neutral-300 px-4 py-3 text-sm" />
    </label>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-display text-4xl font-bold">{title}</h1>
      {subtitle && <p className="mt-2 text-center text-sm text-neutral-500">{subtitle}</p>}
      <div className="mt-8 space-y-4">{children}</div>
    </div>
  );
}

export function useAuthForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return { router, error, setError, busy, setBusy };
}

// Session saver matching the REAL backend envelope:
// { Status, Message, Response: { user, roles, token }, ... }
// (axios gives us res.data = the whole envelope.)
// Mirrors the previous UI: hc_token + hc_session + hc_user (with role) +
// hc_role, and returns the primary role code so callers can route admins.
export function saveSession(res) {
  const body = res?.data || res || {};
  const response = body.Response || body.response || {};
  const user = response.user || body.user || null;
  const roles = response.roles || user?.roles || [];
  const primaryRole = roles[0] || {};
  const roleCode = primaryRole.role_code || "CUSTOMER";
  const roleName = primaryRole.role_name || "Customer";
  const token = response.token || body.token || body.jwt || body.accessToken;

  if (token) localStorage.setItem("hc_token", token);
  localStorage.setItem("hc_session", "1");
  if (user) {
    localStorage.setItem(
      "hc_user",
      JSON.stringify({ ...user, role: roleName, role_code: roleCode })
    );
  }
  localStorage.setItem("hc_role", roleCode);
  return roleCode;
}

export function isAdminRole(roleCode) {
  const rc = roleCode || "";
  return rc === "ADMIN" || rc.toLowerCase().includes("admin");
}

export { Field };
export { apiFetch };
