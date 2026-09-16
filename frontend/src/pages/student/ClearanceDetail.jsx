import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentClearanceApi, clearanceApi } from '../../services/api';
import ClearanceTimeline from '../../components/ClearanceTimeline';
import ProgressBar from '../../components/ProgressBar';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

export default function ClearanceDetail() {
  const { id } = useParams();
  const [clearance, setClearance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(null);

  const fetchClearance = () => {
    setLoading(true);
    studentClearanceApi.show(id)
      .then((res) => setClearance(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClearance(); }, [id]);

  const handleResubmit = async (itemId) => {
    setResubmitting(itemId);
    try {
      await studentClearanceApi.resubmit(itemId);
      fetchClearance();
    } catch { /* ignore */ }
    setResubmitting(null);
  };

  if (loading) return <LoadingSpinner />;
  if (!clearance) return <div className="text-center py-12 text-gray-500">Clearance not found.</div>;

  const rejectedItems = (clearance.clearance_items || []).filter((i) => i.status === 'rejected');
  const isCompleted = clearance.status === 'completed';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/student/dashboard" className="text-sm text-mwu-blue hover:underline">&larr; Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">{clearance.clearance_number}</h1>
          <p className="text-sm text-gray-500">Submitted: {formatDate(clearance.created_at)}</p>
        </div>
        <StatusBadge status={clearance.status} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <ProgressBar percentage={clearance.progress_percentage || 0} label="Clearance Progress" />
      </div>

      {rejectedItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Rejected Items - Action Required</h3>
          {rejectedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-red-800">{item.clearance_office?.name}</p>
                {item.rejection_reason && <p className="text-xs text-red-600">Reason: {item.rejection_reason}</p>}
              </div>
              <button onClick={() => handleResubmit(item.id)} disabled={resubmitting === item.id}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50">
                {resubmitting === item.id ? 'Resubmitting...' : 'Resubmit'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Workflow Steps</h2>
        <ClearanceTimeline items={clearance.clearance_items || []} />
      </div>

      {isCompleted && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Clearance Completed!</h3>
          <p className="text-sm text-green-700 mb-4">Your clearance has been fully approved. You can view your certificate.</p>
          <Link to="/student/certificates" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700">View Certificate</Link>
        </div>
      )}
    </div>
  );
}
