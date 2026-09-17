"use client";

import { useEffect } from "react";

// Floating admin toast: fixed top-center, above every modal/popup,
// auto-dismisses. For errors AND success feedback.
export default function AdminToast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => onDone?.(), 4000);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[200] -translate-x-1/2">
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-2xl ring-1 ring-white/10 backdrop-blur ${
          toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
        }`}
        role={toast.type === "error" ? "alert" : "status"}
      >
        <i className={toast.type === "error" ? "bi bi-x-circle-fill" : "bi bi-check-circle-fill"} />
        <span>{toast.text}</span>
        <button
          type="button"
          onClick={() => onDone?.()}
          aria-label="Dismiss"
          className="rounded p-0.5 text-lg leading-none opacity-80 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
