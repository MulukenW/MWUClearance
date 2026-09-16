export default function EmptyState({ icon = '📭', title = 'No data found', message }) {
  return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">{icon}</p>
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
    </div>
  );
}
