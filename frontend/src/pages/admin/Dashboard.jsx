import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .dashboard()
      .then((res) => setStats(res.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const students = stats?.students || {};
  const clearances = stats?.clearances || {};
  const users = stats?.users || {};
  const system = stats?.system || {};
  const recentClearances = clearances.recent || [];

  const totalClearances = clearances.total || 0;
  const completedClearances = clearances.completed || 0;
  const inProgressClearances = clearances.in_progress || 0;
  const pendingItems = system.pending_items || 0;

  const completionRate = totalClearances > 0 
    ? Math.round((completedClearances / totalClearances) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">System Overview</h1>
        <p className="text-gray-500">Welcome! Here's your clearance system status at a glance.</p>
      </div>

      {/* Critical Stats - Large and Prominent */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-gradient-to-br from-mwu-blue to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <Link to="/admin/students" className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="text-4xl font-black mb-1">{students.total || 0}</div>
          <div className="text-sm text-white/80 font-medium">Total Students</div>
          <div className="text-xs text-white/60 mt-1">{students.active || 0} active</div>
        </div>

        {/* Pending Items - Most Critical */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg ring-4 ring-amber-500/30">
          <div className="flex items-start justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm">
              URGENT
            </span>
          </div>
          <div className="text-4xl font-black mb-1">{pendingItems}</div>
          <div className="text-sm text-white/90 font-medium">Pending Approvals</div>
          <div className="text-xs text-white/70 mt-1">Awaiting officer review</div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-black mb-1">{completionRate}%</div>
          <div className="text-sm text-white/90 font-medium">Completion Rate</div>
          <div className="text-xs text-white/70 mt-1">{completedClearances} of {totalClearances} completed</div>
        </div>

        {/* In Progress */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <Link to="/admin/reports" className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="text-4xl font-black mb-1">{inProgressClearances}</div>
          <div className="text-sm text-white/90 font-medium">In Progress</div>
          <div className="text-xs text-white/70 mt-1">Active clearance requests</div>
        </div>
      </div>

      {/* System Resources */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">System Resources</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link to="/admin/colleges" className="group p-4 rounded-xl border-2 border-gray-100 hover:border-mwu-blue hover:bg-mwu-blue/5 transition-all">
            <div className="text-3xl font-black text-mwu-blue mb-1">{system.colleges || 0}</div>
            <div className="text-sm font-medium text-gray-600 group-hover:text-mwu-blue">Colleges</div>
          </Link>
          <Link to="/admin/departments" className="group p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all">
            <div className="text-3xl font-black text-blue-600 mb-1">{system.departments || 0}</div>
            <div className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Departments</div>
          </Link>
          <Link to="/admin/programs" className="group p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all">
            <div className="text-3xl font-black text-emerald-600 mb-1">{system.programs || 0}</div>
            <div className="text-sm font-medium text-gray-600 group-hover:text-emerald-600">Programs</div>
          </Link>
          <Link to="/admin/clearance-offices" className="group p-4 rounded-xl border-2 border-gray-100 hover:border-amber-500 hover:bg-amber-50 transition-all">
            <div className="text-3xl font-black text-amber-600 mb-1">{system.offices || 0}</div>
            <div className="text-sm font-medium text-gray-600 group-hover:text-amber-600">Clearance Offices</div>
          </Link>
          <Link to="/admin/users" className="group p-4 rounded-xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all">
            <div className="text-3xl font-black text-purple-600 mb-1">{users.total || 0}</div>
            <div className="text-sm font-medium text-gray-600 group-hover:text-purple-600">System Users</div>
          </Link>
        </div>
      </div>

      {/* Recent Clearances */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Recent Clearance Requests</h2>
            <p className="text-sm text-gray-500 mt-0.5">Latest student clearance submissions</p>
          </div>
          <Link 
            to="/admin/reports" 
            className="px-4 py-2 bg-mwu-blue text-white rounded-xl text-sm font-medium hover:bg-mwu-blue-dark transition-colors"
          >
            View All Reports
          </Link>
        </div>
        
        {recentClearances.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No clearance requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide px-6 py-4">
                    Student
                  </th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide px-6 py-4">
                    Student ID
                  </th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide px-6 py-4">
                    Department
                  </th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide px-6 py-4">
                    Clearance #
                  </th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide px-6 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentClearances.slice(0, 10).map((c) => {
                  const statusStyles = {
                    draft: 'bg-gray-100 text-gray-700',
                    submitted: 'bg-blue-100 text-blue-700',
                    in_progress: 'bg-amber-100 text-amber-700',
                    completed: 'bg-emerald-100 text-emerald-700',
                    rejected: 'bg-red-100 text-red-700',
                  };
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{c.student_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600">{c.student_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{c.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{c.clearance_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[c.status] || statusStyles.draft}`}>
                          {c.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-500">
                          {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link 
          to="/admin/users" 
          className="group flex items-start gap-4 p-5 bg-white border-2 border-gray-100 hover:border-blue-500 rounded-xl transition-all hover:shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-800 mb-1 group-hover:text-blue-600">Manage Users</div>
            <div className="text-sm text-gray-500">Create & manage accounts</div>
          </div>
        </Link>

        <Link 
          to="/admin/workflows" 
          className="group flex items-start gap-4 p-5 bg-white border-2 border-gray-100 hover:border-purple-500 rounded-xl transition-all hover:shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-800 mb-1 group-hover:text-purple-600">Workflows</div>
            <div className="text-sm text-gray-500">Configure clearance flow</div>
          </div>
        </Link>

        <Link 
          to="/admin/audit-logs" 
          className="group flex items-start gap-4 p-5 bg-white border-2 border-gray-100 hover:border-amber-500 rounded-xl transition-all hover:shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-800 mb-1 group-hover:text-amber-600">Audit Logs</div>
            <div className="text-sm text-gray-500">Review system activity</div>
          </div>
        </Link>

        <Link 
          to="/admin/settings" 
          className="group flex items-start gap-4 p-5 bg-white border-2 border-gray-100 hover:border-gray-400 rounded-xl transition-all hover:shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-800 mb-1 group-hover:text-gray-600">Settings</div>
            <div className="text-sm text-gray-500">System configuration</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
