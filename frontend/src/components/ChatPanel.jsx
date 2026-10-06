import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";

// Gentle audio chime using Web Audio API (no external asset needed)
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

const COMMON_EMOJIS = ["👍", "✅", "📚", "🎓", "🙏", "📄", "❓", "⚠️", "🤝", "⏳"];

const STUDENT_QUICK_REPLIES = [
  "I have returned all borrowed property/books.",
  "Could you please review my clearance step?",
  "I have attached the payment receipt/document.",
  "Thank you for the quick approval!",
];

const OFFICER_QUICK_REPLIES = [
  "Please bring your student ID and clearance form.",
  "You still have unreturned items in our records.",
  "Cleared and approved. Best wishes!",
  "Please settle the required fees first.",
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  under_review: {
    label: "Under Review",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  rejected: {
    label: "Action Required / Rejected",
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  approved: {
    label: "Approved & Completed",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

/**
 * Modern, responsive ChatPanel with read receipts, quick replies,
 * search inside conversation, emoji picker, and rich bubble layouts.
 */
export default function ChatPanel({
  itemId,
  title,
  subtitle,
  onClose,
  compact = false,
  isOfficer = false,
}) {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [reactions, setReactions] = useState({});
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const pollRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setIsScrolledUp(!isNearBottom);
  };

  const load = useCallback(async () => {
    try {
      const res = await chatApi.messages(itemId);
      const newMessages = res.data?.data?.messages || [];
      const newMeta = res.data?.data || null;

      // Play gentle sound if a new incoming message arrived
      if (
        lastMessageCountRef.current > 0 &&
        newMessages.length > lastMessageCountRef.current
      ) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (!lastMsg.is_mine) {
          playChime();
        }
      }
      lastMessageCountRef.current = newMessages.length;

      setMessages(newMessages);
      setMeta(newMeta);
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
    }
  }, [itemId]);

  useEffect(() => {
    setLoading(true);
    setSearchQuery("");
    setShowSearch(false);
    lastMessageCountRef.current = 0;
    load().then(() => {
      setTimeout(() => scrollToBottom(false), 80);
    });

    pollRef.current = setInterval(() => {
      if (!document.hidden) load();
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [itemId, load, scrollToBottom]);

  // Adjust textarea height dynamically
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        130,
      )}px`;
    }
    if (error) setError(null);
  };

  const send = async (msgToSend) => {
    const content = (msgToSend ?? text).trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await chatApi.send(itemId, content);
      const newMsg = res.data?.data;
      if (newMsg) {
        setMessages((prev) => [...prev, { ...newMsg, is_mine: true }]);
        lastMessageCountRef.current += 1;
      }
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setShowQuickReplies(false);
      setShowEmojis(false);
      playChime();
      setTimeout(() => scrollToBottom(true), 60);
    } catch (err) {
      const reason =
        err.response?.status === 423
          ? "This clearance step is now closed. A new conversation opens with the next office."
          : err.response?.data?.message || "Failed to send the message.";
      setError(reason);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const copyMessage = (id, messageText) => {
    navigator.clipboard?.writeText(messageText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleReaction = (msgId, emoji) => {
    setReactions((prev) => {
      const current = prev[msgId] || [];
      const exists = current.includes(emoji);
      const next = exists ? current.filter((e) => e !== emoji) : [...current, emoji];
      return { ...prev, [msgId]: next };
    });
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.message?.toLowerCase().includes(q) ||
        m.sender?.name?.toLowerCase().includes(q),
    );
  }, [messages, searchQuery]);

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
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const statusInfo = STATUS_CONFIG[meta?.item_status] || STATUS_CONFIG.pending;
  const quickRepliesList = isOfficer ? OFFICER_QUICK_REPLIES : STUDENT_QUICK_REPLIES;

  let lastDay = null;

  return (
    <div
      className={`flex flex-col bg-white rounded-2xl border border-gray-200/90 shadow-md overflow-hidden transition-all ${
        compact ? "h-[30rem]" : "h-[38rem]"
      }`}
    >
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col bg-white border-b border-gray-100 shrink-0 shadow-xs">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Office/Student Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-mwu-blue to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {(title || "C").charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  meta?.can_send ? statusInfo.dot : "bg-gray-400"
                }`}
                title={statusInfo.label}
              />
            </div>

            {/* Title / Subtitle */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-gray-900 truncate">
                  {title || "Clearance Chat"}
                </h3>
                {meta?.step_order && (
                  <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-mwu-blue border border-blue-100/80">
                    Step {meta.step_order}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {subtitle ||
                  (meta?.clearance_number
                    ? `Ref: ${meta.clearance_number}`
                    : "Clearance Communication Channel")}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search toggle */}
            <button
              onClick={() => {
                setShowSearch((prev) => !prev);
                if (showSearch) setSearchQuery("");
              }}
              className={`p-2 rounded-xl transition ${
                showSearch
                  ? "bg-mwu-blue text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title="Search in messages"
              aria-label="Search messages"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Status Pill */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
            </div>

            {/* Close modal (if present) */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search bar expandable */}
        {showSearch && (
          <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center gap-2 transition-all">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversation..."
              className="w-full text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
              autoFocus
            />
            {searchQuery && (
              <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
                {filteredMessages.length} found
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSearch(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ─── Messages Canvas ─────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2 bg-[#f8fafc] relative"
        style={{
          backgroundImage:
            "radial-gradient(#e2e8f0 0.75px, transparent 0.75px), radial-gradient(#e2e8f0 0.75px, #f8fafc 0.75px)",
          backgroundSize: "30px 30px",
          backgroundPosition: "0 0, 15px 15px",
        }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner text="Syncing conversation..." />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-xl mb-3 shadow-xs">
              ⚠️
            </div>
            <p className="text-sm font-semibold text-gray-800">{error}</p>
            <button
              onClick={() => load()}
              className="mt-3 text-xs font-semibold text-mwu-blue hover:underline"
            >
              Try reconnecting
            </button>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-mwu-blue flex items-center justify-center text-2xl mb-3 shadow-xs">
              💬
            </div>
            <p className="text-sm font-bold text-gray-800">
              {searchQuery ? "No matching messages" : "Start the conversation"}
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
              {searchQuery
                ? `No messages matched "${searchQuery}".`
                : `Communicate directly with ${
                    title || "the clearance office"
                  } regarding approvals, missing property, or required receipts.`}
            </p>
            {!searchQuery && meta?.can_send && (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-sm">
                {quickRepliesList.slice(0, 2).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => send(item)}
                    className="text-[11px] bg-white hover:bg-blue-50 text-gray-700 hover:text-mwu-blue border border-gray-200/80 rounded-full px-3 py-1 shadow-2xs transition"
                  >
                    ⚡ {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          filteredMessages.map((m) => {
            const showDay = dayLabel(m.created_at) !== lastDay;
            lastDay = dayLabel(m.created_at);
            const msgReactions = reactions[m.id] || [];

            return (
              <div key={m.id} className="group transition-all">
                {/* Sticky day divider */}
                {showDay && (
                  <div className="text-center my-4 sticky top-1 z-5">
                    <span className="text-[11px] font-semibold text-gray-500 bg-white/90 backdrop-blur-xs border border-gray-200/80 shadow-2xs rounded-full px-3 py-0.5 inline-block">
                      {dayLabel(m.created_at)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-end gap-2 ${
                    m.is_mine ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar for received messages */}
                  {!m.is_mine && (
                    <div
                      className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-600 to-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs mb-1"
                      title={m.sender?.name || "Sender"}
                    >
                      {(m.sender?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`relative max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 shadow-2xs transition-all ${
                      m.is_mine
                        ? "bg-gradient-to-r from-mwu-blue to-blue-600 text-white rounded-br-xs shadow-blue-900/10"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-xs shadow-gray-200/60"
                    }`}
                  >
                    {/* Sender name for received messages */}
                    {!m.is_mine && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-bold text-mwu-blue">
                          {m.sender?.name || "Officer"}
                        </span>
                        {m.sender?.role && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700">
                            {m.sender.role}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Body */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words select-text font-normal">
                      {m.message}
                    </p>

                    {/* Time & Read Receipts */}
                    <div
                      className={`flex items-center justify-end gap-1.5 text-[10px] mt-1 select-none ${
                        m.is_mine ? "text-blue-100/90" : "text-gray-400"
                      }`}
                    >
                      <span>{time(m.created_at)}</span>
                      {m.is_mine && (
                        <span
                          title={m.read_at ? `Read at ${time(m.read_at)}` : "Delivered"}
                          className="font-mono text-[11px] inline-flex items-center"
                        >
                          {m.read_at ? (
                            <span className="text-cyan-300 font-bold" aria-label="Read">
                              ✓✓
                            </span>
                          ) : (
                            <span className="text-blue-200" aria-label="Delivered">
                              ✓
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Reactions Display */}
                    {msgReactions.length > 0 && (
                      <div className="flex items-center gap-1 -mb-1 mt-1.5 flex-wrap">
                        {msgReactions.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => toggleReaction(m.id, r)}
                            className="text-xs bg-white/95 border border-gray-200 shadow-2xs rounded-full px-1.5 py-0.5 hover:scale-110 transition"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Hover Action Bar (Copy & React) */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl px-1 py-0.5 shadow-sm transition-all z-10 ${
                        m.is_mine ? "-left-18 text-gray-600" : "-right-18 text-gray-600"
                      }`}
                    >
                      <button
                        onClick={() => copyMessage(m.id, m.message)}
                        className="p-1 hover:text-mwu-blue hover:bg-gray-50 rounded-lg text-xs"
                        title={copiedId === m.id ? "Copied!" : "Copy message"}
                      >
                        {copiedId === m.id ? "✓" : "📋"}
                      </button>
                      <button
                        onClick={() => toggleReaction(m.id, "👍")}
                        className="p-1 hover:bg-gray-50 rounded-lg text-xs"
                        title="React thumbs up"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => toggleReaction(m.id, "✅")}
                        className="p-1 hover:bg-gray-50 rounded-lg text-xs"
                        title="React checkmark"
                      >
                        ✅
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Scroll-to-bottom floating button */}
        {isScrolledUp && (
          <button
            onClick={() => scrollToBottom(true)}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs text-mwu-blue border border-gray-200/90 shadow-md rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 hover:bg-blue-50 transition z-20"
          >
            <span>↓ Jump to latest</span>
          </button>
        )}
      </div>

      {/* ─── Quick Replies Bar ───────────────────────────────── */}
      {showQuickReplies && meta?.can_send && (
        <div className="bg-gray-50/90 border-t border-gray-200/70 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 transition-all">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
            ⚡ Quick Replies:
          </span>
          {quickRepliesList.map((reply, i) => (
            <button
              key={i}
              onClick={() => {
                setText(reply);
                if (textareaRef.current) {
                  textareaRef.current.focus();
                }
              }}
              className="text-xs font-medium whitespace-nowrap bg-white hover:bg-blue-50 text-gray-700 hover:text-mwu-blue border border-gray-200 rounded-lg px-2.5 py-1 transition shadow-2xs"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* ─── Emoji Dropdown ──────────────────────────────────── */}
      {showEmojis && meta?.can_send && (
        <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 shadow-inner">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setText((prev) => prev + emoji);
                setShowEmojis(false);
                textareaRef.current?.focus();
              }}
              className="text-lg hover:scale-125 transition p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* ─── Composer or Closed Notice ──────────────────────── */}
      {meta && !meta.can_send ? (
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200/80 text-amber-900 shrink-0 flex items-start gap-3">
          <div className="text-xl shrink-0 mt-0.5">🔒</div>
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-amber-950">Conversation Concluded:</span>{" "}
            This clearance step is marked as{" "}
            <span className="font-semibold underline">
              {meta.item_status?.replace("_", " ")}
            </span>
            . To keep clearance records organized, messages are active only while a
            step is under review. The next office in your workflow will have its own
            dedicated chat.
          </div>
        </div>
      ) : (
        <div className="p-3 bg-white border-t border-gray-100 shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
            {/* Quick replies toggle */}
            <button
              type="button"
              onClick={() => setShowQuickReplies((prev) => !prev)}
              className={`p-2 rounded-xl transition shrink-0 ${
                showQuickReplies
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              title="Toggle quick responses"
            >
              ⚡
            </button>

            {/* Emoji toggle */}
            <button
              type="button"
              onClick={() => setShowEmojis((prev) => !prev)}
              className={`p-2 rounded-xl transition shrink-0 ${
                showEmojis
                  ? "bg-blue-100 text-mwu-blue"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              title="Emoji shortcuts"
            >
              😊
            </button>

            {/* Multiline auto-expanding textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={2000}
                placeholder={`Message ${title || "the clearance office"}... (Enter to send)`}
                className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-2.5 pr-14 focus:outline-none focus:ring-2 focus:ring-mwu-blue/30 focus:border-mwu-blue resize-none max-h-32 transition leading-snug"
              />
              {text.length > 1500 && (
                <span className="absolute right-3 bottom-2 text-[10px] text-gray-400">
                  {text.length}/2000
                </span>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-mwu-blue to-blue-600 text-white hover:from-mwu-blue-dark hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs hover:shadow transition shrink-0"
              aria-label="Send message"
            >
              {sending ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
          <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-gray-400">
            <span>Press <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">Enter</kbd> to send, <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">Shift + Enter</kbd> for new line</span>
            <span>Workflow-encrypted & logged</span>
          </div>
        </div>
      )}
    </div>
  );
}
