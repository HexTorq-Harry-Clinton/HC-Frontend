"use client";

// Live circular upload progress for admin: gold ring, big % center,
// filename, uploaded / total MB, speed and ETA underneath.
// Props: prog = { loaded, total, percent, speedBps, etaSecs, name }.
function fmtMB(bytes) {
  const mb = (Number(bytes) || 0) / (1024 * 1024);
  return mb >= 10 ? mb.toFixed(1) : mb.toFixed(2);
}

function fmtSpeed(bps) {
  const b = Number(bps) || 0;
  if (b <= 0) return "—";
  const mb = b / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB/s` : `${Math.max(1, Math.round(b / 1024))} KB/s`;
}

function fmtEta(secs) {
  if (secs == null || !Number.isFinite(secs)) return "—";
  const s = Math.max(0, Math.ceil(secs));
  if (s < 60) return `${s}s left`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s left`;
}

export default function UploadRing({ prog }) {
  if (!prog) return null;
  const percent = Math.min(100, Math.max(0, Number(prog.percent) || 0));
  const R = 34;
  const C = 2 * Math.PI * R;
  const done = prog.percent >= 100;
  return (
    <div className="flex items-center gap-4  border border-gold/50 bg-gold/10 px-4 py-3">
      <div className="relative h-[76px] w-[76px] flex-none">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={R} fill="none" stroke="#e7e2d6" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            stroke={done ? "#15803d" : "#c6a15b"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (C * percent) / 100}
            style={{ transition: "stroke-dashoffset 0.15s linear, stroke 0.3s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-neutral-900">
          {done ? <i className="bi bi-check-lg text-lg text-green-700" /> : `${percent}%`}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-neutral-900">
          {done ? "Upload complete" : "Uploading…"} {prog.name ? `· ${prog.name}` : ""}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-neutral-600">
          {fmtMB(prog.loaded)} / {fmtMB(prog.total)} MB · {fmtSpeed(prog.speedBps)} · ETA {fmtEta(prog.etaSecs)}
        </p>
        <div className="mt-1.5 h-1.5 w-44 max-w-full overflow-hidden  bg-neutral-200">
          <div
            className={`h-full  transition-[width] duration-150 ${done ? "bg-green-600" : "bg-gold"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
