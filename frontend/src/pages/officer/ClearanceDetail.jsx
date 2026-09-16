import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { clearanceApi } from "../../services/api";
import ClearanceTimeline from "../../components/ClearanceTimeline";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatDate, formatDateTime } from "../../utils/helpers";

export default function OfficerClearanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchItem = () => {
    setLoading(true);
    clearanceApi
      .show(id)
      .then((res) => setItem(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchComments = () => {
    clearanceApi
      .getComments(id)
      .then((res) => setComments(res.data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchItem();
    fetchComments();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await clearanceApi.approve(id, "");
      fetchItem();
    } catch {
      /* ignore */
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await clearanceApi.reject(id, rejectReason, "");
      setShowReject(false);
      setRejectReason("");
      fetchItem();
    } catch {
      /* ignore */
    }
    setActionLoading(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      await clearanceApi.addComment(id, newComment, isInternal);
      setNewComment("");
      fetchComments();
    } catch {
      /* ignore */
    }
    setCommentLoading(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!item)
    return (
      <div className="text-center py-12 text-gray-500">
        Clearance item not found.
      </div>
    );

  const clearance = item.clearance || {};
  const student = clearance.student || {};
  const canAct = item.status === "pending" || item.status === "submitted";

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/officer/pending"
          className="text-sm text-mwu-blue hover:underline"
        >
          &larr; Back to Pending
        </Link>
      </div>

      {/* Student Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Student Information
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>{" "}
            <span className="font-medium">{student.name || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500">Student ID:</span>{" "}
            <span className="font-medium">{student.student_id || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500">Department:</span>{" "}
            <span className="font-medium">
              {student.department?.name || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Clearance #:</span>{" "}
            <span className="font-medium">{clearance.clearance_number}</span>
          </div>
        </div>
      </div>

      {/* Current Item Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {item.clearance_office?.name || "Office"}
            </h2>
            <p className="text-sm text-gray-500">
              Submitted: {formatDate(item.created_at)}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        {item.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">
              <span className="font-medium">Rejection reason:</span>{" "}
              {item.rejection_reason}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {canAct && (
          <div className="flex gap-3 mt-4 pt-4 border-t">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={actionLoading}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Full Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Full Clearance Timeline
        </h2>
        <ClearanceTimeline items={clearance.clearance_items || []} />
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Comments</h2>

        {/* Add comment form */}
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none text-sm"
            />
            <button
              type="submit"
              disabled={commentLoading || !newComment.trim()}
              className="bg-mwu-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mwu-blue-dark disabled:opacity-50"
            >
              {commentLoading ? "..." : "Send"}
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded"
            />
            Internal comment (officers only)
          </label>
        </form>

        {/* Comment list */}
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No comments yet.
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className={`p-3 rounded-lg ${c.is_internal ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {c.user?.name || "System"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(c.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{c.comment}</p>
                {c.is_internal && (
                  <span className="text-xs text-yellow-600 font-medium mt-1 inline-block">
                    Internal
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showReject && (
        <Modal onClose={() => setShowReject(false)}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Reject Clearance Item
          </h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection (required)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              placeholder="Explain why this item is being rejected..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowReject(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
