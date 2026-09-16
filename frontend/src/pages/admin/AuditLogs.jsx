import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import SearchBar from "../../components/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { formatDateTime } from "../../utils/helpers";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const params = {};
    if (actionFilter) params.action = actionFilter;
    if (search) params.search = search;
    setLoading(true);
    adminApi
      .auditLogs(params)
      .then((res) => setLogs(res.data.data?.data || res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [actionFilter]);

  const handleSearch = (v) => {
    setSearch(v);
    if (v === "") {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      adminApi
        .auditLogs(params)
        .then((res) => setLogs(res.data.data?.data || res.data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const getActionBadge = (action) => {
    const styles = {
      create: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      update: "bg-blue-50 text-blue-700 ring-blue-600/20",
      delete: "bg-red-50 text-red-700 ring-red-600/20",
      login: "bg-blue-50 text-mwu-blue ring-mwu-blue/20",
      logout: "bg-gray-50 text-gray-600 ring-gray-500/20",
      approve: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      reject: "bg-orange-50 text-orange-700 ring-orange-600/20",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[action] || styles.logout}`}
      >
        {action}
      </span>
    );
  };

  if (loading && logs.length === 0) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white shadow-sm">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track all system activities and changes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Search logs..."
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none bg-gray-50 focus:bg-white transition-all"
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
        </select>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <EmptyState message="No audit logs found." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap font-mono text-xs">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-800 font-medium">
                      {log.user?.name || log.user_name || "System"}
                    </td>
                    <td className="px-5 py-3.5">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-xs truncate">
                      {log.description || log.details || "N/A"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 font-mono text-xs">
                      {log.ip_address || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">{logs.length}</span>{" "}
            log entries
          </div>
        </div>
      )}
    </div>
  );
}
