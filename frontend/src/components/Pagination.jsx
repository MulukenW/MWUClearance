export default function Pagination({ currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(lastPage, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}
        className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Prev</button>
      {pages.map((p) => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`px-3 py-1 text-sm rounded border ${p === currentPage ? 'bg-mwu-blue text-white border-mwu-blue' : 'border-gray-300 hover:bg-gray-50'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= lastPage}
        className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
    </div>
  );
}
