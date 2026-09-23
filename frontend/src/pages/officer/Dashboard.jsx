import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { clearanceApi, authApi } from "../../services/api";
import Modal from "../../components/Modal";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const statusConfig = {
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Pending",
  },
  under_review: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Under Review",
  },
  approved: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Rejected",
  },
  locked: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: "Locked",
  },
};

function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    Promise.all([
      clearanceApi.statistics().catch(() => ({ data: { data: {} } })),
      clearanceApi.pending().catch(() => ({ data: { data: [] } })),
      clearanceApi
        .history({ per_page: 5 })
        .catch(() => ({ data: { data: [] } })),
    ])
      .then(([statsRes, pendingRes, historyRes]) => {
        setStats(statsRes.data.data || {});
        setPending(pendingRes.data.data?.data || pendingRes.data.data || []);
        const histData = historyRes.data.data;
        setHistory(Array.isArray(histData) ? histData : histData?.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshAfterAction = (itemId) => {
    setPending((p) => p.filter((i) => i.id !== itemId));
    setStats((s) =>
      s ? { ...s, pending: Math.max(0, (s.pending || 1) - 1) } : s,
    );
  };

  const handleApprove = async (item) => {
    if (actionLoading) return;
    setActionLoading(item.id);
    try {
      await clearanceApi.approve(item.id, "");
      refreshAfterAction(item.id);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to approve this item.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectFor || !rejectReason.trim() || actionLoading) return;
    setActionLoading(rejectFor.id);
    try {
      await clearanceApi.reject(rejectFor.id, rejectReason, "");
      refreshAfterAction(rejectFor.id);
      setRejectFor(null);
      setRejectReason("");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reject this item.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const officeName = user?.clearance_office?.name || "Clearance Office";
  const deptName = user?.department?.name;
  const roleName = user?.role?.name || "Officer";
  const total = stats?.total || 0;
  const pendingCount = stats?.pending || 0;
  const approvedCount = stats?.approved || 0;
  const rejectedCount = stats?.rejected || 0;
  const approvalRate =
    total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Officer Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and manage clearance requests
          </p>
        </div>
        <Link
          to="/officer/pending"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-mwu-blue to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 transition-all shadow-sm shadow-mwu-blue/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Review Queue
        </Link>
      </div>

      {/* Officer Profile Card */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-slate-300 text-sm mt-0.5">{roleName}</p>
          </div>
          <div className="hidden sm:grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Office</p>
              <p className="font-semibold">{officeName}</p>
            </div>
            {deptName && (
              <div>
                <p className="text-slate-400 text-xs">Department Scope</p>
                <p className="font-semibold">{deptName}</p>
              </div>
            )}
            <div>
              <p className="text-slate-400 text-xs">Pending Review</p>
              <p className="font-semibold text-amber-400">{pendingCount}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Approval Rate</p>
              <p className="font-semibold text-emerald-400">{approvalRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Pending",
            value: pendingCount,
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
            gradient: "from-amber-500 to-orange-500",
          },
          {
            label: "Approved",
            value: approvedCount,
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
            gradient: "from-emerald-500 to-green-600",
          },
          {
            label: "Rejected",
            value: rejectedCount,
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
            gradient: "from-red-500 to-rose-600",
          },
          {
            label: "Total Processed",
            value: total,
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            ),
            gradient: "from-blue-500 to-blue-600",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-3xl font-extrabold text-gray-800 mt-2">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Approval Rate Bar */}
      {total > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Approval Performance
            </h3>
            <span className="text-sm font-bold text-emerald-600">
              {approvalRate}% approved
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {approvedCount > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${(approvedCount / total) * 100}%` }}
              />
            )}
            {rejectedCount > 0 && (
              <div
                className="h-full bg-red-500 transition-all duration-700"
                style={{ width: `${(rejectedCount / total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-500">
                Approved ({approvedCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-gray-500">
                Rejected ({rejectedCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-500">
                Pending ({pendingCount})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Pending / Recent History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab("pending")}
            className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-colors ${
              tab === "pending"
                ? "text-mwu-blue border-b-2 border-mwu-blue bg-mwu-blue/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-colors ${
              tab === "history"
                ? "text-mwu-blue border-b-2 border-mwu-blue bg-mwu-blue/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Recent History
          </button>
        </div>

        {/* Pending Tab */}
        {tab === "pending" && (
          <div>
            {pending.length === 0 ? (
              <div className="text-center py-14">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  All Caught Up!
                </h3>
                <p className="text-sm text-gray-400">
                  No pending clearance requests to review.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pending.slice(0, 10).map((item) => {
                  const student =
                    item.clearance_request?.student || item.clearance?.student;
                  const office = item.clearance_office;
                  const detailTo = `/officer/clearance/${item.clearance_request_id || item.clearance_id || item.id}`;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                    >
                      <Link
                        to={detailTo}
                        className="flex items-center gap-4 min-w-0"
                      >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 text-sm font-bold">
                          {student?.name?.charAt(0) ||
                            student?.full_name?.charAt(0) ||
                            "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {student?.name ||
                              student?.full_name ||
                              "Unknown Student"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {student?.student_id || ""}
                            {student?.department?.name
                              ? ` · ${student.department.name}`
                              : ""}
                            {office?.name ? ` · ${office.name}` : ""}
                          </p>
                        </div>
                      </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={!!actionLoading}
                          title="Approve this step"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === item.id ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => setRejectFor(item)}
                          disabled={!!actionLoading}
                          title="Reject this step"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                        <StatusBadge status={item.status} />
                        <Link
                          to={detailTo}
                          className="p-1"
                          title="Open full review"
                        >
                          <svg
                            className="w-4 h-4 text-gray-300 group-hover:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {pending.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <Link
                  to="/officer/pending"
                  className="text-xs font-medium text-mwu-blue hover:text-mwu-blue-dark"
                >
                  View all pending ({pendingCount}) &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div>
            {history.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-sm text-gray-400">No history yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.slice(0, 10).map((item) => {
                  const student =
                    item.clearance_request?.student || item.clearance?.student;
                  return (
                    <Link
                      key={item.id}
                      to={`/officer/clearance/${item.clearance_request_id || item.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                            item.status === "approved"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {student?.name?.charAt(0) ||
                            student?.full_name?.charAt(0) ||
                            "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {student?.name || student?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.processed_at
                              ? new Date(item.processed_at).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )
                              : ""}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </Link>
                  );
                })}
              </div>
            )}
            {history.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <Link
                  to="/officer/history"
                  className="text-xs font-medium text-mwu-blue hover:text-mwu-blue-dark"
                >
                  View full history &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/officer/pending"
          className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Review Pending
            </p>
            <p className="text-xs text-gray-400">
              {pendingCount} items awaiting your review
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-300 ml-auto group-hover:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
        <Link
          to="/officer/history"
          className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">View History</p>
            <p className="text-xs text-gray-400">
              {approvedCount + rejectedCount} items processed
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-300 ml-auto group-hover:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
      {/* Reject Modal (quick action) */}
      {rejectFor && (
        <Modal isOpen={!!rejectFor} onClose={() => setRejectFor(null)}>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            Reject Clearance Item
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {(rejectFor.clearance_request?.student ||
              rejectFor.clearance?.student)?.name || "Student"} · {rejectFor.clearance_office?.name || "Clearance Office"}
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for rejection (required)
          </label>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this item is being rejected..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setRejectFor(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
