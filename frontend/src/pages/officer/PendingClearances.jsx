import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { clearanceApi } from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import SearchBar from "../../components/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { formatDate } from "../../utils/helpers";

export default function PendingClearances() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    clearanceApi
      .pending()
      .then((res) => setItems(res.data.data?.data || res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = search
    ? items.filter(
        (i) =>
          i.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          i.clearance?.clearance_number
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          i.clearance_office?.name
            ?.toLowerCase()
            .includes(search.toLowerCase()),
      )
    : items;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Pending Clearances
      </h1>

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by student, clearance #, or office..."
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No pending clearances found." />
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
                  Submitted
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
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/officer/clearance/${item.id}`}
                      className="text-sm text-mwu-blue hover:underline"
                    >
                      Review
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
