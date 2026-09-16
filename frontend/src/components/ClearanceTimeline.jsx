import StatusBadge from './StatusBadge';

export default function ClearanceTimeline({ items = [] }) {
  if (!items.length) {
    return <p className="text-gray-500 text-sm">No workflow steps available.</p>;
  }

  const sorted = [...items].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));

  return (
    <div className="relative">
      {sorted.map((item, idx) => {
        const isLast = idx === sorted.length - 1;
        const officeName = item.clearance_office?.name || item.office_name || `Step ${item.step_order}`;
        return (
          <div key={item.id || idx} className="flex gap-4">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                item.status === 'approved' ? 'bg-green-500' :
                item.status === 'rejected' ? 'bg-red-500' :
                item.status === 'pending' || item.status === 'under_review' ? 'bg-amber-500' :
                item.status === 'not_required' ? 'bg-gray-300' :
                'bg-gray-400'
              }`}>
                {item.status === 'approved' ? '✓' : item.status === 'rejected' ? '✗' : item.status === 'not_required' ? '—' : item.step_order}
              </div>
              {!isLast && <div className="w-0.5 h-12 bg-gray-200" />}
            </div>
            {/* Content */}
            <div className={`flex-1 ${isLast ? '' : 'pb-6'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">{officeName}</h4>
                  {item.processed_at && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(item.processed_at).toLocaleDateString()}
                    </p>
                  )}
                  {item.status === 'rejected' && item.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {item.rejection_reason}</p>
                  )}
                </div>
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
