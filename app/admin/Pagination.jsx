"use client";

// Shared admin list kit: every data table gets search-top-right + pagination
// with page sizes 5 / 10 / 15 / 25 / 50. Usage per page:
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const shown = paginate(filtered, page, pageSize);
//   <Pagination page={page} setPage={setPage} total={filtered.length}
//               pageSize={pageSize} setPageSize={setPageSize} />
// Reset to page 1 whenever search/filters change.
export const PAGE_SIZES = [5, 10, 15, 25, 50];

export function paginate(list, page, pageSize) {
  const size = Number(pageSize) || 10;
  const start = (Math.max(1, Number(page) || 1) - 1) * size;
  return (Array.isArray(list) ? list : []).slice(start, start + size);
}

export function pageRange(page, total, pageSize) {
  const size = Number(pageSize) || 10;
  const count = Array.isArray(total) ? total.length : Number(total) || 0;
  if (count === 0) return { from: 0, to: 0, pages: 0 };
  const pages = Math.max(1, Math.ceil(count / size));
  const safe = Math.min(Math.max(1, Number(page) || 1), pages);
  return { from: (safe - 1) * size + 1, to: Math.min(safe * size, count), pages };
}

function pageNums(page, pages) {
  const safe = Math.min(Math.max(1, page), pages);
  const set = new Set([1, pages, safe - 1, safe, safe + 1]);
  return [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
}

const numBtn =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold transition-colors";

export default function Pagination({ page, setPage, total, pageSize, setPageSize }) {
  const { from, to, pages } = pageRange(page, total, pageSize);
  const count = Array.isArray(total) ? total.length : Number(total) || 0;
  if (count === 0) return null;
  const safe = Math.min(Math.max(1, Number(page) || 1), pages);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-neutral-500">
        Showing <span className="font-bold text-neutral-900">{from}–{to}</span> of{" "}
        <span className="font-bold text-neutral-900">{count}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Per page
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm font-semibold text-neutral-900 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setPage(Math.max(1, safe - 1))}
          disabled={safe <= 1}
          aria-label="Previous page"
          className={`${numBtn} border border-neutral-300 text-neutral-700 hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-30`}
        >
          ‹
        </button>
        {pageNums(safe, pages).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPage(n)}
            aria-label={`Page ${n}`}
            aria-current={n === safe ? "page" : undefined}
            className={`${numBtn} ${
              n === safe
                ? "bg-neutral-950 text-gold"
                : "border border-neutral-300 text-neutral-700 hover:border-neutral-950"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPage(Math.min(pages, safe + 1))}
          disabled={safe >= pages}
          aria-label="Next page"
          className={`${numBtn} border border-neutral-300 text-neutral-700 hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-30`}
        >
          ›
        </button>
      </div>
    </div>
  );
}
