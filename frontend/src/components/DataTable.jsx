import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function DataTable({ columns = [], data = [], loading = false, emptyMessage = 'No records found', onRowClick }) {
  if (loading) return <LoadingSpinner />;
  if (!data.length) return <EmptyState title={emptyMessage} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th key={col.key} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
