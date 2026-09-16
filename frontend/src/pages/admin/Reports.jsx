import { useState } from "react";
import { adminApi } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatDateTime } from "../../utils/helpers";

const REPORT_TYPES = [
  {
    value: "summary",
    label: "Summary Report",
    desc: "Overall clearance statistics",
  },
  {
    value: "department",
    label: "Department Report",
    desc: "Clearance by department",
  },
  { value: "college", label: "College Report", desc: "Clearance by college" },
  { value: "office", label: "Office Report", desc: "Performance per office" },
  {
    value: "pending",
    label: "Pending Clearances",
    desc: "Currently pending items",
  },
  {
    value: "rejected",
    label: "Rejected Clearances",
    desc: "Items that were rejected",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */
const n = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
};

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-700",
  approved: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  locked: "bg-gray-100 text-gray-600",
};
const statusStyle = (s) => STATUS_STYLES[s] || "bg-gray-100 text-gray-600";
const statusLabel = (s) => (s ? s.replace(/_/g, " ") : "—");

/* ─── Shared building blocks ─────────────────────────────────────────── */
const ICONS = {
  total:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  refresh:
    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  x: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  trendUp: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  trendDown: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
  users:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  building:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
};

function StatCard({ label, value, color = "text-gray-800", bg = "bg-gray-100", icon, suffix }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center ${color} shrink-0`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d={icon}
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className={`text-2xl font-bold ${color} leading-tight`}>
          {value === null || value === undefined ? "—" : value}
          {value !== null && value !== undefined && suffix && (
            <span className="text-sm font-semibold text-gray-400 ml-0.5">
              {suffix}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function StatRow({ cards }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}

function ProgressBar({ pct, gradient = "from-mwu-blue to-blue-500" }) {
  return (
    <div className="flex items-center gap-3 justify-end">
      <div className="w-28 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${Math.min(100, n(pct) || 0)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right">
        {n(pct) ?? 0}%
      </span>
    </div>
  );
}

function GroupTable({ title, subtitle, rows, columns, progressCol, progressGradient }) {
  if (!rows?.length) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-3">{title}</h3>
        <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-6 text-center">
          No data available yet.
        </p>
      </div>
    );
  }
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-0.5 mb-3">{subtitle}</p>
      )}
      <div className="mt-3 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider ${c.right ? "text-right" : "text-left"}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {columns.map((c) => {
                    const raw = row[c.key];
                    const num = n(raw);
                    return (
                      <td
                        key={c.key}
                        className={`px-5 py-3.5 text-sm ${c.right ? "text-right" : "text-left"} ${c.strong ? "font-semibold text-gray-800" : "text-gray-600"}`}
                      >
                        {c.key === progressCol ? (
                          <ProgressBar pct={raw} gradient={progressGradient} />
                        ) : num !== null ? (
                          num.toLocaleString()
                        ) : (
                          (raw ?? "—")
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusStyle(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function StepsProgress({ done, total }) {
  const pct = n(total) > 0 ? Math.round((n(done) / n(total)) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
        {done}/{total}
      </span>
    </div>
  );
}

function EmptyReport({ message = "No data available for this report." }) {
  return (
    <div className="p-10 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

function Pagination({ meta, page, onPage }) {
  if (!meta || n(meta.last_page) <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        Page <span className="font-semibold text-gray-700">{meta.current_page}</span> of{" "}
        {meta.last_page} · {meta.total} record{meta.total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= n(meta.last_page)}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ─── Summary Report ─────────────────────────────────────────────────── */
const OVERVIEW_CARDS = [
  { label: "Total Requests", key: "total", color: "text-mwu-blue", bg: "bg-blue-50", icon: ICONS.total },
  { label: "Submitted", key: "submitted", color: "text-sky-600", bg: "bg-sky-50", icon: ICONS.clock },
  { label: "In Progress", key: "in_progress", color: "text-amber-600", bg: "bg-amber-50", icon: ICONS.refresh },
  { label: "Completed", key: "completed", color: "text-green-600", bg: "bg-green-50", icon: ICONS.check },
  { label: "Rejected", key: "rejected", color: "text-red-600", bg: "bg-red-50", icon: ICONS.x },
  { label: "Completion Rate", key: "completion_rate", color: "text-green-600", bg: "bg-green-50", suffix: "%", icon: ICONS.trendUp },
  { label: "Rejection Rate", key: "rejection_rate", color: "text-red-600", bg: "bg-red-50", suffix: "%", icon: ICONS.trendDown },
  { label: "Avg. Processing Time", key: "avg_processing_hours", color: "text-gray-700", bg: "bg-gray-100", suffix: "h", icon: ICONS.clock },
];

function SummaryReport({ data }) {
  const overview = data.overview || {};
  const withRate = (rows) =>
    (rows || []).map((r) => ({
      ...r,
      completion_rate: n(r.total) > 0 ? Math.round((n(r.completed) / n(r.total)) * 100) : 0,
    }));

  return (
    <div className="p-6">
      <StatRow
        cards={OVERVIEW_CARDS.map((c) => ({
          ...c,
          value: n(overview[c.key]),
        }))}
      />
      <GroupTable
        title="By Student Type"
        subtitle="Clearance requests grouped by enrollment type"
        rows={withRate(data.by_student_type)}
        progressCol="completion_rate"
        columns={[
          { key: "name", label: "Student Type", strong: true },
          { key: "total", label: "Total", right: true },
          { key: "completed", label: "Completed", right: true },
          { key: "in_progress", label: "In Progress", right: true },
          { key: "rejected", label: "Rejected", right: true },
          { key: "completion_rate", label: "Completion", right: true },
        ]}
      />
      <GroupTable
        title="By Department"
        subtitle="Clearance requests grouped by academic department"
        rows={withRate(data.by_department)}
        progressCol="completion_rate"
        columns={[
          { key: "name", label: "Department", strong: true },
          { key: "total", label: "Total", right: true },
          { key: "completed", label: "Completed", right: true },
          { key: "completion_rate", label: "Completion", right: true },
        ]}
      />
    </div>
  );
}

/* ─── Department Report (clearance requests list) ────────────────────── */
function DepartmentReport({ data }) {
  const summary = data.summary || {};
  const rows = Array.isArray(data.data) ? data.data : [];
  return (
    <div className="p-6">
      <StatRow
        cards={[
          { label: "Total Requests", value: n(summary.total), color: "text-mwu-blue", bg: "bg-blue-50", icon: ICONS.total },
          { label: "Completed", value: n(summary.completed), color: "text-green-600", bg: "bg-green-50", icon: ICONS.check },
          { label: "In Progress", value: n(summary.in_progress), color: "text-amber-600", bg: "bg-amber-50", icon: ICONS.refresh },
          { label: "Completion Rate", value: n(summary.completion_rate), suffix: "%", color: "text-green-600", bg: "bg-green-50", icon: ICONS.trendUp },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyReport message="No clearance requests match this report." />
      ) : (
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  {["Clearance #", "Student", "Department", "Type", "Status", "Progress", "Submitted"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-800 whitespace-nowrap">
                      {r.clearance_number}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {r.student?.name}
                      <span className="block text-xs text-gray-400">{r.student?.student_id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{r.student?.department}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{r.student?.student_type}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StepsProgress
                        done={String(r.progress || "0/0").split("/")[0]}
                        total={String(r.progress || "0/0").split("/")[1]}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {fmtDate(r.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── College Report (aggregate by department) ───────────────────────── */
function CollegeReport({ data }) {
  const rows = (data.by_department || []).map((r) => ({
    ...r,
    name: r.department_name,
    completion_rate: n(r.total) > 0 ? Math.round((n(r.completed) / n(r.total)) * 100) : 0,
  }));
  return (
    <div className="p-6">
      <StatRow
        cards={[
          { label: "Total Requests", value: n(data.total), color: "text-mwu-blue", bg: "bg-blue-50", icon: ICONS.total },
          { label: "Completed", value: n(data.completed), color: "text-green-600", bg: "bg-green-50", icon: ICONS.check },
          { label: "Departments", value: rows.length, color: "text-purple-600", bg: "bg-purple-50", icon: ICONS.building },
          { label: "Completion Rate", value: n(data.completion_rate), suffix: "%", color: "text-green-600", bg: "bg-green-50", icon: ICONS.trendUp },
        ]}
      />
      <GroupTable
        title="Clearance by Department"
        subtitle="All departments in the selected college scope"
        rows={rows}
        progressCol="completion_rate"
        columns={[
          { key: "name", label: "Department", strong: true },
          { key: "total", label: "Total", right: true },
          { key: "completed", label: "Completed", right: true },
          { key: "in_progress", label: "In Progress", right: true },
          { key: "rejected", label: "Rejected", right: true },
          { key: "completion_rate", label: "Completion", right: true },
        ]}
      />
    </div>
  );
}

/* ─── Office Report (performance per office) ─────────────────────────── */
function OfficeReport({ data }) {
  const rows = Array.isArray(data) ? data : data?.data || [];
  if (!rows.length) return <EmptyReport message="No office activity recorded yet." />;
  const best = [...rows].sort((a, b) => n(b.approval_rate) - n(a.approval_rate))[0];
  return (
    <div className="p-6">
      <StatRow
        cards={[
          { label: "Offices Active", value: rows.length, color: "text-purple-600", bg: "bg-purple-50", icon: ICONS.building },
          { label: "Items Processed", value: rows.reduce((s, r) => s + (n(r.total) || 0), 0), color: "text-mwu-blue", bg: "bg-blue-50", icon: ICONS.total },
          { label: "Total Approved", value: rows.reduce((s, r) => s + (n(r.approved) || 0), 0), color: "text-green-600", bg: "bg-green-50", icon: ICONS.check },
          { label: "Best Approval Rate", value: n(best?.approval_rate), suffix: "%", color: "text-green-600", bg: "bg-green-50", icon: ICONS.trendUp },
        ]}
      />
      <GroupTable
        title="Performance per Office"
        subtitle="How each clearance office is handling its items"
        rows={rows}
        progressCol="approval_rate"
        progressGradient="from-green-500 to-emerald-400"
        columns={[
          { key: "office", label: "Office", strong: true },
          { key: "total", label: "Total", right: true },
          { key: "approved", label: "Approved", right: true },
          { key: "rejected", label: "Rejected", right: true },
          { key: "pending", label: "Pending", right: true },
          { key: "locked", label: "Locked", right: true },
          { key: "avg_processing_hours", label: "Avg. Hours", right: true },
          { key: "approval_rate", label: "Approval Rate", right: true },
        ]}
      />
    </div>
  );
}

/* ─── Pending Clearances Report ──────────────────────────────────────── */
function daysBadge(days) {
  const d = n(days);
  if (d === null) return <span className="text-sm text-gray-400">—</span>;
  const cls =
    d >= 7
      ? "bg-red-100 text-red-700"
      : d >= 3
        ? "bg-amber-100 text-amber-700"
        : "bg-green-100 text-green-700";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {d} day{d === 1 ? "" : "s"}
    </span>
  );
}

function PendingReport({ data }) {
  const rows = Array.isArray(data.data) ? data.data : [];
  return (
    <div className="p-6">
      <StatRow
        cards={[
          { label: "Total Pending", value: n(data.total_pending), color: "text-amber-600", bg: "bg-amber-50", icon: ICONS.clock },
          { label: "On This Page", value: rows.length, color: "text-mwu-blue", bg: "bg-blue-50", icon: ICONS.total },
          {
            label: "Waiting 7+ Days",
            value: rows.filter((r) => n(r.days_pending) >= 7).length,
            color: "text-red-600",
            bg: "bg-red-50",
            icon: ICONS.x,
          },
          {
            label: "Oldest Waiting",
            value: rows.length ? Math.max(...rows.map((r) => n(r.days_pending) || 0)) : 0,
            suffix: "days",
            color: "text-gray-700",
            bg: "bg-gray-100",
            icon: ICONS.refresh,
          },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyReport message="Nothing is currently pending. Great!" />
      ) : (
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  {["Clearance #", "Student", "Department", "Current Office", "Steps", "Waiting", "Submitted"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-800 whitespace-nowrap">
                      {r.clearance_number}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {r.student?.name}
                      <span className="block text-xs text-gray-400">{r.student?.student_id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{r.student?.department}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{r.current_office}</td>
                    <td className="px-5 py-3.5">
                      <StepsProgress done={r.completed_steps} total={r.total_steps} />
                    </td>
                    <td className="px-5 py-3.5">{daysBadge(r.days_pending)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {fmtDate(r.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Rejected Clearances Report ─────────────────────────────────────── */
function RejectedReport({ data }) {
  const rows = Array.isArray(data.data) ? data.data : [];
  return (
    <div className="p-6">
      <StatRow
        cards={[
          { label: "Total Rejected", value: n(data.total_rejected), color: "text-red-600", bg: "bg-red-50", icon: ICONS.x },
          { label: "On This Page", value: rows.length, color: "text-mwu-blue", bg: "bg-blue-50", icon: ICONS.total },
          {
            label: "Rejection Reasons",
            value: rows.reduce((s, r) => s + (r.rejected_by?.length || 0), 0),
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: ICONS.building,
          },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyReport message="No rejected clearances. Everything is on track." />
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-semibold text-gray-800">{r.clearance_number}</span>
                  <StatusBadge status="rejected" />
                </div>
                <span className="text-xs text-gray-400">Submitted {fmtDate(r.submitted_at)}</span>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm text-gray-700">
                  {r.student?.name}
                  <span className="text-gray-400"> · {r.student?.student_id} · {r.student?.department}</span>
                </p>
                <div className="mt-3 space-y-2.5">
                  {(r.rejected_by || []).map((rb, i) => (
                    <div key={i} className="rounded-xl bg-red-50/60 border border-red-100 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-red-700">{rb.office}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">by {rb.processed_by}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-400">{fmtDate(rb.processed_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1.5">{rb.reason || "No reason recorded."}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
const PAGINATED = new Set(["department", "pending", "rejected"]);

export default function Reports() {
  const [reportType, setReportType] = useState("summary");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const handleGenerate = async (targetPage = 1) => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const fn = adminApi.reports[reportType];
      if (!fn) {
        setError("Report type not available.");
        return;
      }
      const params = PAGINATED.has(reportType) ? { page: targetPage } : {};
      const res = await fn(params);
      const body = res.data ?? {};
      const d = body.data;
      // Aggregate reports wrap their payload in data{...}; list reports put rows
      // in data[] and keep summary/meta/total_* on the body itself.
      const payload =
        d && !Array.isArray(d) && (d.overview || d.by_department)
          ? d
          : body;
      setData(payload);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const selectType = (value) => {
    setReportType(value);
    setPage(1);
  };

  const renderReport = () => {
    switch (reportType) {
      case "summary":
        return <SummaryReport data={data} />;
      case "department":
        return <DepartmentReport data={data} />;
      case "college":
        return <CollegeReport data={data} />;
      case "office":
        return <OfficeReport data={data} />;
      case "pending":
        return <PendingReport data={data} />;
      case "rejected":
        return <RejectedReport data={data} />;
      default:
        return <EmptyReport />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate and view clearance reports
          </p>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.value}
            onClick={() => selectType(rt.value)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              reportType === rt.value
                ? "border-mwu-blue/30 bg-mwu-blue/5 ring-2 ring-mwu-blue/20"
                : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50"
            }`}
          >
            <p
              className={`text-sm font-semibold ${reportType === rt.value ? "text-mwu-blue" : "text-gray-700"}`}
            >
              {rt.label}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{rt.desc}</p>
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={() => handleGenerate(1)}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-mwu-blue to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
          {error}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {data && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-800">
              {REPORT_TYPES.find((r) => r.value === reportType)?.label}
            </h2>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-mwu-blue border border-gray-200 hover:border-mwu-blue/30 rounded-lg px-3 py-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print
            </button>
          </div>

          {renderReport()}

          {PAGINATED.has(reportType) && (
            <Pagination
              meta={data.meta}
              page={page}
              onPage={(p) => {
                setPage(p);
                handleGenerate(p);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
