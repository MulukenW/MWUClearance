import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { chatApi } from "../../services/api";
import ChatPanel from "../../components/ChatPanel";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";

const STATUS_BADGES = {
  pending: {
    bg: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-500",
    label: "Pending",
  },
  under_review: {
    bg: "bg-blue-50 text-blue-700 border-blue-200/80",
    dot: "bg-blue-500",
    label: "Under Review",
  },
  rejected: {
    bg: "bg-red-50 text-red-700 border-red-200/80",
    dot: "bg-red-500",
    label: "Rejected / Fix",
  },
};

// Deterministic pastel color generator for avatar based on string
const getAvatarGradient = (str = "") => {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-indigo-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-pink-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export default function Chats() {
  const { user, roleCode } = useAuth();
  const isStudent = roleCode === "student";
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItemId, setActiveItemId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback((silent = false) => {
    if (!silent) setIsRefreshing(true);
    chatApi
      .threads()
      .then((res) => {
        const data = res.data?.data || [];
        setThreads(data);
        // Automatically select first thread on desktop if none selected
        if (!activeItemId && data.length > 0 && window.innerWidth >= 1024) {
          setActiveItemId(data[0].item_id);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, [activeItemId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => {
      if (!document.hidden) load(true);
    }, 7000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const openThread = (item) => {
    setActiveItemId(item.item_id);
    setThreads((prev) =>
      prev.map((t) => (t.item_id === item.item_id ? { ...t, unread_count: 0 } : t)),
    );
  };

  const totalUnread = useMemo(() => {
    return threads.reduce((acc, t) => acc + (t.unread_count || 0), 0);
  }, [threads]);

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      // Status filter
      if (statusFilter === "unread" && (!t.unread_count || t.unread_count <= 0)) {
        return false;
      }
      if (
        statusFilter !== "all" &&
        statusFilter !== "unread" &&
        t.item_status !== statusFilter
      ) {
        return false;
      }

      // Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const officeName = t.office?.name?.toLowerCase() || "";
      const studentName = t.student_name?.toLowerCase() || "";
      const studentId = t.student_id_no?.toLowerCase() || "";
      const clearanceNum = t.clearance_number?.toLowerCase() || "";
      const lastMsg = t.last_message?.message?.toLowerCase() || "";

      return (
        officeName.includes(q) ||
        studentName.includes(q) ||
        studentId.includes(q) ||
        clearanceNum.includes(q) ||
        lastMsg.includes(q)
      );
    });
  }, [threads, search, statusFilter]);

  const activeThread = useMemo(() => {
    return threads.find((x) => x.item_id === activeItemId);
  }, [threads, activeItemId]);

  const formatRelativeTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts.replace(" ", "T"));
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner text="Connecting to clearance chat network..." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-mwu-blue to-blue-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900">
                Clearance Communications
              </h1>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                  {totalUnread} new
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isStudent
                ? "Direct two-way channel with offices reviewing your clearance request."
                : "Active clearance communications with students under your office review."}
            </p>
          </div>
        </div>

        {/* Live sync indicator & manual refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Polling
          </span>
          <button
            onClick={() => load(false)}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-mwu-blue hover:bg-gray-100 rounded-xl transition border border-gray-200 disabled:opacity-50"
            title="Refresh conversations"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-mwu-blue" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Main Content Grid ──────────────────────────────────── */}
      {threads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-mwu-blue text-3xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            💬
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            No Active Conversations
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-6">
            {isStudent
              ? "You do not have any clearance steps currently pending or under review. When you submit a clearance request, conversation threads with your academic advisor and departments will appear here automatically."
              : "No students are currently awaiting clearance review from your office. New conversation threads will appear here when students submit requests."}
          </p>
          {isStudent && (
            <Link
              to="/student/clearance"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-mwu-blue to-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow transition"
            >
              <span>View Clearance Status</span>
              <span>→</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          {/* ─── Left Sidebar: Thread List (12 on mobile, 4-5 on desktop) ─── */}
          <div
            className={`lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-xs flex flex-col overflow-hidden h-[38rem] ${
              activeItemId ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Search & Filter Header */}
            <div className="p-3.5 border-b border-gray-100 bg-gray-50/60 space-y-2.5 shrink-0">
              {/* Search input */}
              <div className="relative">
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isStudent ? "Search by office name..." : "Search student or ID..."
                  }
                  className="w-full text-xs bg-white rounded-xl border border-gray-200 pl-9 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-mwu-blue/30 focus:border-mwu-blue text-gray-800 placeholder-gray-400 transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
                {[
                  { id: "all", label: "All", count: threads.length },
                  { id: "unread", label: "Unread", count: totalUnread },
                  { id: "pending", label: "Pending" },
                  { id: "under_review", label: "In Review" },
                  { id: "rejected", label: "Rejected" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                      statusFilter === f.id
                        ? "bg-mwu-blue text-white shadow-2xs"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/70"
                    }`}
                  >
                    <span>{f.label}</span>
                    {f.count !== undefined && f.count > 0 && (
                      <span
                        className={`text-[10px] px-1 rounded-full ${
                          statusFilter === f.id
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {f.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread Cards Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
              {filteredThreads.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <p className="text-xs font-semibold text-gray-600">
                    No conversations match filter
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Try clearing your search query or switching filters.
                  </p>
                </div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = activeItemId === t.item_id;
                  const titleText = isStudent
                    ? t.office?.name || "Clearance Office"
                    : t.student_name || "Student";
                  const avatarGradient = getAvatarGradient(titleText);
                  const statusObj = STATUS_BADGES[t.item_status] || STATUS_BADGES.pending;

                  return (
                    <button
                      key={t.item_id}
                      onClick={() => openThread(t)}
                      className={`w-full text-left p-3 rounded-xl transition-all relative flex items-start gap-3 border ${
                        isSelected
                          ? "bg-blue-50/70 border-mwu-blue/40 shadow-xs ring-1 ring-mwu-blue/20"
                          : "bg-white border-transparent hover:bg-gray-50/80 hover:border-gray-200"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${avatarGradient} text-white flex items-center justify-center font-bold text-sm shadow-2xs`}
                        >
                          {titleText.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusObj.dot}`}
                        />
                      </div>

                      {/* Info & Last message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p
                            className={`text-xs font-bold truncate ${
                              isSelected ? "text-mwu-blue" : "text-gray-900"
                            }`}
                          >
                            {titleText}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                            {formatRelativeTime(t.last_message?.created_at)}
                          </span>
                        </div>

                        {/* Subtitle / Clearance ref */}
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate mb-1">
                          <span className="font-mono text-gray-600 font-medium">
                            {t.clearance_number}
                          </span>
                          {t.step_order && (
                            <>
                              <span>·</span>
                              <span className="text-gray-500">Step {t.step_order}</span>
                            </>
                          )}
                          {!isStudent && t.student_id_no && (
                            <>
                              <span>·</span>
                              <span className="text-gray-400">{t.student_id_no}</span>
                            </>
                          )}
                        </div>

                        {/* Last message text */}
                        <p className="text-xs text-gray-500 truncate line-clamp-1 leading-snug">
                          {t.last_message ? (
                            <>
                              {t.last_message.is_mine && (
                                <span className="font-semibold text-gray-700">You: </span>
                              )}
                              {t.last_message.message}
                            </>
                          ) : (
                            <span className="italic text-gray-400">
                              No messages sent yet
                            </span>
                          )}
                        </p>

                        {/* Footer badges */}
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusObj.bg}`}
                          >
                            {statusObj.label}
                          </span>

                          {t.unread_count > 0 && (
                            <span className="bg-mwu-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                              {t.unread_count} new
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ─── Right Pane: Active Chat Panel (12 on mobile, 7-8 on desktop) ─── */}
          <div
            className={`lg:col-span-7 xl:col-span-8 ${
              activeItemId ? "block" : "hidden lg:block"
            }`}
          >
            {activeItemId ? (
              <div>
                {/* Mobile back button */}
                <button
                  onClick={() => setActiveItemId(null)}
                  className="lg:hidden mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-mwu-blue hover:underline bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs"
                >
                  <span>← Back to all conversations</span>
                </button>

                <ChatPanel
                  itemId={activeItemId}
                  title={
                    isStudent
                      ? activeThread?.office?.name || "Clearance Office"
                      : activeThread?.student_name || "Student"
                  }
                  subtitle={
                    isStudent
                      ? `${activeThread?.clearance_number || "Clearance"} · Step ${
                          activeThread?.step_order || "1"
                        } Review`
                      : `${activeThread?.student_id_no || ""} · ${
                          activeThread?.clearance_number || ""
                        }`
                  }
                  isOfficer={!isStudent}
                />
              </div>
            ) : (
              <div className="h-[38rem] rounded-2xl border border-gray-200/90 bg-white shadow-xs flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-mwu-blue text-2xl flex items-center justify-center mb-4 shadow-xs">
                  💬
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Select a Conversation
                </h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-4">
                  Pick a clearance step on the left to review messages, reply with
                  updates, or send required clearance clarifications.
                </p>
                <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-left max-w-sm text-xs text-gray-600 space-y-1.5">
                  <p className="font-semibold text-gray-800">💡 Clearance Chat Tips:</p>
                  <p>• Only active and pending steps accept messages.</p>
                  <p>• Once approved, steps automatically lock and move forward.</p>
                  <p>• Use quick replies for common clearance requests.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
