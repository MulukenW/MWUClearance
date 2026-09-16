import { getStatusColor } from '../utils/helpers';

export default function StatusBadge({ status }) {
  const colorClass = getStatusColor(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown'}
    </span>
  );
}
