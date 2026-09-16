import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { studentClearanceApi, authApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const statusConfig = {
  draft: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
    label: "Draft",
  },
  submitted: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Submitted",
  },
  in_progress: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "In Progress",
  },
  completed: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Completed",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Rejected",
  },
};

function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [clearances, setClearances] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentClearanceApi.list().catch(() => ({ data: { data: [] } })),
      authApi.me().catch(() => ({ data: { data: {} } })),
    ])
      .then(([clearRes, meRes]) => {
        setClearances(clearRes.data.data || []);
        setStudentData(meRes.data.data?.student || null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const active = clearances.find(
    (c) => c.status === "in_progress" || c.status === "submitted",
  );
  const completed = clearances.filter((c) => c.status === "completed");
  const totalItems = active?.clearance_items?.length || 0;
  const approvedItems =
    active?.clearance_items?.filter((i) => i.status === "approved").length || 0;
  const currentStep = active?.clearance_items?.find(
    (item) => item.status === "pending" || item.status === "under_review",
  );
  const progressPct =
    active && totalItems > 0
      ? Math.round((approvedItems / totalItems) * 100)
      : active?.progress_percentage || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track your clearance requests and certificates
          </p>
        </div>
        <Link
          to="/student/clearance/new"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Clearance
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="bg-gradient-to-r from-mwu-blue via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-mwu-blue/20">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-blue-200 text-sm mt-0.5">{user?.email}</p>
          </div>
          <div className="hidden sm:grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {studentData?.student_id && (
              <div>
                <p className="text-blue-200 text-xs">Student ID</p>
                <p className="font-semibold">{studentData.student_id}</p>
              </div>
            )}
            <div>
              <p className="text-blue-200 text-xs">Department</p>
              <p className="font-semibold">
                {studentData?.department?.name || user?.department?.name || "N/A"}
              </p>
            </div>
            {studentData?.academic_year && (
              <div>
                <p className="text-blue-200 text-xs">Academic Year</p>
                <p className="font-semibold">{studentData.academic_year}</p>
              </div>
            )}
            {studentData?.admission_year && (
              <div>
                <p className="text-blue-200 text-xs">Batch</p>
                <p className="font-semibold">{studentData.admission_year}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Requests",
            value: clearances.length,
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
          {
            label: "In Progress",
            value: clearances.filter(
              (c) => c.status === "in_progress" || c.status === "submitted",
            ).length,
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
            label: "Completed",
            value: completed.length,
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

      {/* Active Clearance with Progress */}
      {active && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                Active Clearance
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                {active.clearance_number}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={active.status} />
              <Link
                to={`/student/clearance/${active.id}`}
                className="text-xs font-medium text-mwu-blue hover:text-mwu-blue-dark"
              >
                View Details &rarr;
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-bold text-mwu-blue">
                {progressPct}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-mwu-blue to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {approvedItems} of {totalItems} steps completed
            </p>
          </div>

          {currentStep?.clearance_office?.name && (
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Your clearance is under review by {currentStep.clearance_office.name}.
            </div>
          )}

          {/* Steps Grid */}
          {active.clearance_items && active.clearance_items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {active.clearance_items
                .sort((a, b) => a.step_order - b.step_order)
                .map((item) => {
                  const isApproved = item.status === "approved";
                  const isPending =
                    item.status === "pending" || item.status === "under_review";
                  const isRejected = item.status === "rejected";
                  const isLocked = item.status === "locked";
                  const isNotRequired = item.status === "not_required";
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700"
                          : isPending
                            ? "bg-amber-50 text-amber-700"
                            : isRejected
                              ? "bg-red-50 text-red-700"
                              : isNotRequired
                                ? "bg-gray-50 text-gray-400"
                                : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      <span className="flex-shrink-0">
                        {isApproved && (
                          <svg
                            className="w-4 h-4 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {isPending && (
                          <span className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center text-[8px]">
                            &#9654;
                          </span>
                        )}
                        {isRejected && (
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                        {isLocked && (
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        )}
                        {isNotRequired && (
                          <span className="text-gray-300 text-sm">-</span>
                        )}
                      </span>
                      <span className="truncate">
                        {item.clearance_office?.name ||
                          `Step ${item.step_order}`}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* No active clearance - CTA */}
      {!active && clearances.length === 0 && (
        <div className="bg-gradient-to-br from-mwu-blue/5 to-blue-50 rounded-2xl border border-mwu-blue/10 p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-mwu-blue to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-mwu-blue/20">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            No Clearance Requests Yet
          </h3>
          <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
            Start your clearance process by submitting a new request. You'll
            need to go through 11 approval steps from various university
            offices.
          </p>
          <Link
            to="/student/clearance/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-mwu-blue to-blue-600 text-white rounded-xl font-semibold hover:from-mwu-blue-dark hover:to-blue-700 transition-all shadow-lg shadow-mwu-blue/20"
          >
            Start Clearance Request
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* Clearance History */}
      {clearances.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Request History
            </h2>
            <span className="text-xs text-gray-400">
              {clearances.length} request{clearances.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {clearances.map((c) => (
              <Link
                key={c.id}
                to={`/student/clearance/${c.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      c.status === "completed"
                        ? "bg-emerald-50 text-emerald-600"
                        : c.status === "rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {c.status === "completed" ? (
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
                    ) : c.status === "rejected" ? (
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
                    ) : (
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
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 font-mono">
                      {c.clearance_number}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.submitted_at
                        ? new Date(c.submitted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : c.created_at
                          ? new Date(c.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      {c.academic_year && ` · ${c.academic_year}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
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
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/student/certificates"
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
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              My Certificates
            </p>
            <p className="text-xs text-gray-400">
              View & download your clearance certificates
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
          to="/student/clearance/new"
          className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mwu-blue to-blue-600 flex items-center justify-center text-white shadow-lg">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">New Request</p>
            <p className="text-xs text-gray-400">
              Submit a new clearance request
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
    </div>
  );
}
