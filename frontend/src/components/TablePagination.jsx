/** Compact page list with ellipses, e.g. [1, 2, "…", 6, 7, 8, "…", 12, 13] */
export function getPageNumbers(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const wanted = new Set(
    [1, 2, current - 1, current, current + 1, last - 1, last].filter(
      (p) => p >= 1 && p <= last,
    ),
  );
  const sorted = [...wanted].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * Table footer with "Showing X of Y" and First/Prev/numbers/Next/Last pager.
 * Server-driven: pass the current page, last page and total from API meta.
 */
export default function TablePagination({
  page,
  lastPage,
  total,
  showingCount,
  label = "items",
  onPageChange,
}) {
  return (
    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-gray-500">
        Showing{" "}
        <span className="font-semibold text-gray-700">{showingCount}</span> of{" "}
        <span className="font-semibold text-gray-700">{total}</span> {label}
        {lastPage > 1 && (
          <span className="text-gray-400">
            {" "}
            · Page {page} of {lastPage}
          </span>
        )}
      </p>
      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            First
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>
          {getPageNumbers(page, lastPage).map((p, idx) =>
            p === "…" ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  p === page
                    ? "bg-mwu-blue text-white border-mwu-blue shadow-sm"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            onClick={() => onPageChange(Math.min(lastPage, page + 1))}
            disabled={page === lastPage}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
          <button
            onClick={() => onPageChange(lastPage)}
            disabled={page === lastPage}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}
