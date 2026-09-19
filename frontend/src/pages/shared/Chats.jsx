import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { chatApi } from "../../services/api";
import ChatPanel from "../../components/ChatPanel";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../contexts/AuthContext";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};

export default function Chats() {
  const { user, roleCode } = useAuth();
  const isStudent = roleCode === "student";
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItemId, setActiveItemId] = useState(null);
  const pollRef = useRef(null);

  const load = useCallback(() => {
    chatApi
      .threads()
      .then((res) => setThreads(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => {
      if (!document.hidden) load();
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const openThread = (item) => {
    setActiveItemId(item.item_id);
    setThreads((prev) =>
      prev.map((t) => (t.item_id === item.item_id ? { ...t, unread_count: 0 } : t)),
    );
  };

  if (loading) return <LoadingSpinner text="Loading conversations..." />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isStudent
            ? "Conversations with the offices reviewing your clearance. A chat is available while a step is in progress or was rejected."
            : "Conversations with students whose clearance steps are assigned to your office."}
        </p>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No open conversations"
          message={
            isStudent
              ? "Once your clearance is being reviewed, you can chat with the handling office here."
              : "When students under your office start a clearance, their conversations appear here."
          }
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Thread list */}
          <div className="lg:col-span-1 space-y-3">
            {threads.map((t) => (
              <button
                key={t.item_id}
                onClick={() => openThread(t)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  activeItemId === t.item_id
                    ? "border-mwu-blue bg-blue-50/60 shadow-sm"
                    : "border-gray-200 bg-white hover:border-mwu-blue/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">
                      {isStudent ? t.office?.name || "Office" : t.student_name || "Student"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {isStudent
                        ? t.student_id_no
                          ? `${t.clearance_number} · ${t.student_id_no}`
                          : t.clearance_number
                        : `${t.clearance_number} · ${t.office?.name || ""}`}
                    </p>
                  </div>
                  {t.unread_count > 0 && (
                    <span className="shrink-0 bg-mwu-blue text-white text-[11px] font-bold rounded-full min-w-[1.4rem] h-5 px-1.5 flex items-center justify-center">
                      {t.unread_count}
                    </span>
                  )}
                </div>
                {t.last_message ? (
                  <p className="text-xs text-gray-500 mt-2 truncate">
                    {t.last_message.is_mine ? "You: " : ""}
                    {t.last_message.message}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-2 italic">No messages yet</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      STATUS_STYLES[t.item_status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {(t.item_status || "").replace("_", " ")}
                  </span>
                  {t.last_message?.created_at && (
                    <span className="text-[10px] text-gray-400">
                      {new Date(t.last_message.created_at.replace(" ", "T")).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Active conversation */}
          <div className="lg:col-span-2">
            {activeItemId ? (
              (() => {
                const t = threads.find((x) => x.item_id === activeItemId);
                return (
                  <ChatPanel
                    itemId={activeItemId}
                    title={isStudent ? t?.office?.name : t?.student_name}
                    subtitle={
                      isStudent
                        ? `${t?.clearance_number || ""} · step ${t?.step_order ?? ""}`
                        : `${t?.clearance_number || ""} · ${t?.office?.name || ""}`
                    }
                  />
                );
              })()
            ) : (
              <div className="h-[34rem] rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center text-center px-8">
                <span className="text-4xl mb-3">💬</span>
                <p className="font-medium text-gray-700">Select a conversation</p>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  Messages follow the clearance workflow — each office only sees the
                  conversation for the step they are handling.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
