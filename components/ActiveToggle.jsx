"use client";

import { useState } from "react";

// Toggle switch: same behavior as the previous UI.
export default function ActiveToggle({ active, onToggle }) {
  const [busy, setBusy] = useState(false);
  const on = active === true || active === 1;

  const click = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await onToggle(!on);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={click}
      disabled={busy}
      aria-pressed={on}
      title={on ? "Active — click to deactivate" : "Inactive — click to activate"}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 ${
        on ? "bg-emerald-600" : "bg-neutral-300"
      } ${busy ? "opacity-50" : ""}`}
    >
      <span
        className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${
          on ? "left-[20px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}
