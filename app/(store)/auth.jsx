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

export async function saveSession(res) {
  const data = res?.data || res;
  const token = data?.token || data?.jwt || data?.accessToken;
  if (token) localStorage.setItem("hc_token", token);
  if (data?.user) localStorage.setItem("hc_user", JSON.stringify(data.user));
  if (data?.role_code) localStorage.setItem("hc_role", data.role_code);
}

export { Field };
export { apiFetch };
