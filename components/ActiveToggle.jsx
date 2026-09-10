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
      onClick={click}
      disabled={busy}
      aria-pressed={on}
      title={on ? "Active — click to deactivate" : "Inactive — click to activate"}
      className={`relative h-[22px] w-10 rounded-full transition-colors ${
        on ? "bg-[#1e7a3c]" : "bg-[#ddd8cc]"
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
