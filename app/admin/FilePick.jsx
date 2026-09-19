"use client";

import { useRef, useState } from "react";

// Unmissable upload button for every admin file slot: gold dashed dropzone
// with a big upload icon, explicit "Choose file" label, format hint, picked
// filename confirmation, click + drag-and-drop. Props:
// - accept: input accept string
// - onPick(file): staged on choose/drop
// - fileName: staged file name to confirm (optional)
// - hint: e.g. "JPG / PNG / WEBP ≤ 3 MB" (optional)
// - small: compact one-line variant for tight table spots
export default function FilePick({ accept, onPick, fileName, hint, small }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const take = (file) => {
    if (file) onPick?.(file);
    // reset so picking the SAME file again still fires onChange
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        take(e.dataTransfer.files?.[0]);
      }}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
        small ? "px-3 py-2" : "px-4 py-3.5"
      } ${
        drag
          ? "border-gold bg-gold/15"
          : fileName
            ? "border-green-600/60 bg-green-50 hover:border-gold hover:bg-gold/10"
            : "border-gold bg-gold/10 hover:bg-gold/20"
      }`}
    >
      <span
        className={`flex flex-none items-center justify-center rounded-full bg-gold text-neutral-950 ${
          small ? "h-7 w-7 text-sm" : "h-10 w-10 text-xl"
        }`}
      >
        <i className={`bi ${fileName ? "bi-check-lg" : "bi-cloud-arrow-up"}`} />
      </span>
      <span className="min-w-0">
        <span className={`block truncate font-bold text-neutral-900 ${small ? "text-xs" : "text-sm"}`}>
          {fileName ? fileName : "Choose file to upload"}
        </span>
        <span className={`block truncate text-neutral-500 ${small ? "text-[10px]" : "text-xs"}`}>
          {fileName ? "Staged — click to replace, or drop a new file" : hint || "Click to browse, or drag & drop here"}
        </span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => take(e.target.files?.[0])}
        className="hidden"
        tabIndex={-1}
      />
    </div>
  );
}
