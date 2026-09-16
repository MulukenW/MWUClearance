import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { clearanceApi } from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import SearchBar from "../../components/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { CLEARANCE_STATUS_OPTIONS } from "../../constants";
import { formatDate } from "../../utils/helpers";

export default function OfficerHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    setLoading(true);
    clearanceApi
      .history(params)
      .then((res) => setItems(res.data.data?.data || res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <LoadingSpinner />;

  const filtered = search
    ? items.filter(
        (i) =>
          i.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          i.clearance?.clearance_number
            ?.toLowerCase()
            .includes(search.toLowerCase()),
      )
    : items;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Clearance History
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none"
        >
          {CLEARANCE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No history records found." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                  Student
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                  Clearance #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                  Office
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {item.clearance?.student?.name || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.clearance?.clearance_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.clearance_office?.name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(item.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/officer/clearance/${item.id}`}
                      className="text-sm text-mwu-blue hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
