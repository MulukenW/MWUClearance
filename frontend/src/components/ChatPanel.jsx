import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Workflow-scoped chat between a student and one clearance office.
 * The conversation is bound to a clearance item (a workflow step), so it
 * follows the clearance: it opens while the step is pending / under review /
 * rejected, and closes automatically once the step is approved (the next
 * office gets its own conversation).
 */
export default function ChatPanel({ itemId, title, subtitle, onClose, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pollPaused, setPollPaused] = useState(false);
  const scrollRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await chatApi.messages(itemId);
      setMessages(res.data?.data?.messages || []);
      setMeta(res.data?.data || null);
      setError(null);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 403
          ? "You are not authorized to join this conversation."
          : "Failed to load the conversation.");
      setError(msg);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [itemId, scrollToBottom]);

  useEffect(() => {
    setLoading(true);
    load();
    // Poll every 5s for new messages (simple, no websockets needed)
    pollRef.current = setInterval(() => {
      if (!document.hidden && !pollPaused) load();
    }, 5000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const send = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await chatApi.send(itemId, trimmed);
      const msg = res.data?.data;
      if (msg) setMessages((prev) => [...prev, { ...msg, is_mine: true }]);
      setText("");
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      const reason =
        err.response?.status === 423
          ? "This step moved on — the chat is closed. A new conversation opens with the next office."
          : err.response?.data?.message || "Failed to send the message.";
      setError(reason);
    } finally {
      setSending(false);
    }
  };

  const time = (ts) => {
    if (!ts) return "";
    const d = new Date(ts.replace(" ", "T"));
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const dayLabel = (ts) => {
    if (!ts) return "";
    const d = new Date(ts.replace(" ", "T"));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };

  // Group consecutive messages by day
  let lastDay = null;

  return (
    <div
      className={`flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${
        compact ? "h-[28rem]" : "h-[34rem]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-mwu-blue text-white shrink-0">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {title || "Clearance Chat"}
          </p>
          {subtitle && (
            <p className="text-xs text-blue-100 truncate">{subtitle}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg hover:bg-white/10 text-blue-100 hover:text-white transition"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-50">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner text="Loading conversation..." />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-red-600 text-center max-w-xs">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-sm font-medium text-gray-700">No messages yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Say hello — this conversation is only between you and the{" "}
              {meta?.office?.name || "office"} handling this step.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const showDay = dayLabel(m.created_at) !== lastDay;
            lastDay = dayLabel(m.created_at);
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="text-center my-2">
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-100 rounded-full px-3 py-0.5">
                      {dayLabel(m.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 mb-1 ${
                      m.is_mine
                        ? "bg-mwu-blue text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    {!m.is_mine && m.sender && (
                      <p className="text-[11px] font-semibold text-mwu-blue mb-0.5">
                        {m.sender.name}
                        {m.sender.role ? ` · ${m.sender.role}` : ""}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                    <p
                      className={`text-[10px] mt-1 text-right ${
                        m.is_mine ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {time(m.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      {meta && !meta.can_send ? (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 shrink-0">
          🔒 This step is now <span className="font-semibold">{meta.item_status?.replace("_", " ")}</span>{" "}
          — the chat is closed. {meta.office?.name ? `${meta.office.name} no longer` : "The office no longer"} accepts
          messages here. A new conversation opens automatically with the next office in the workflow.
        </div>
      ) : (
        <form onSubmit={send} className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-white shrink-0">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            placeholder={`Message ${meta?.office?.name || "the office"}…`}
            maxLength={2000}
            className="flex-1 text-sm rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mwu-blue/40 focus:border-mwu-blue"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="p-2.5 rounded-full bg-mwu-blue text-white hover:bg-mwu-blue-dark disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
            aria-label="Send message"
          >
            {sending ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
