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
        className={`flex items-center gap-3 px-5 py-3 text-sm font-medium text-white shadow-xl ${
          toast.type === "error" ? "bg-red-700" : "bg-green-700"
        }`}
        role={toast.type === "error" ? "alert" : "status"}
      >
        <span>{toast.type === "error" ? "⚠" : "✓"}</span>
        <span>{toast.text}</span>
        <button
          onClick={() => onDone?.()}
          aria-label="Dismiss"
          className="ml-2 text-lg leading-none opacity-80 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
