import { useState, useEffect, useCallback, useRef } from "react";

// Inactivity session timer: after `timeoutMs` without user activity the
// session is marked expired (SessionModals shows the "Session Expired"
// screen; the actual logout happens when the user clicks through).
// A warning modal with countdown appears `warningMs` before expiry.
//
// Implementation notes:
// - Timer state lives in refs so the interval callback never goes stale and
//   the timer is never reset by re-renders (an earlier version reset the
//   timer every time isWarning/isExpired toggled, so expiry could never be
//   reached while the tab was in the foreground).
// - Expiry latches via expiredRef: once expired, activity events no longer
//   reset anything until extendSession() is called.
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_WARNING_MS = 60 * 1000; // 60 seconds
const LAST_ACTIVE_KEY = "mwu_last_active_time";

export function useSessionTimer({
  isAuthenticated,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningMs = DEFAULT_WARNING_MS,
}) {
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.round(warningMs / 1000),
  );

  const lastActiveRef = useRef(Date.now());
  const expiredRef = useRef(false);

  // Record user activity (throttled localStorage write for multi-tab sync)
  const recordActivity = useCallback(() => {
    if (expiredRef.current) return;
    const now = Date.now();
    lastActiveRef.current = now;
    setIsWarning((w) => (w ? false : w));
    try {
      if (
        !recordActivity.lastWrite ||
        now - recordActivity.lastWrite > 10000
      ) {
        recordActivity.lastWrite = now;
        localStorage.setItem(LAST_ACTIVE_KEY, String(now));
      }
    } catch {
      // ignore
    }
  }, []);

  // Extend / reset the timer manually (e.g. from the warning modal)
  const extendSession = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;
    expiredRef.current = false;
    recordActivity.lastWrite = now;
    try {
      localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    } catch {
      // ignore
    }
    setIsWarning(false);
    setIsExpired(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsExpired(false);
      setIsWarning(false);
      expiredRef.current = false;
      return;
    }

    // Initialize on auth (not on every re-render)
    const now = Date.now();
    lastActiveRef.current = now;
    expiredRef.current = false;
    try {
      localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    } catch {
      // ignore
    }

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    const interval = setInterval(() => {
      if (expiredRef.current) return;

      // Use the most recent of in-memory / localStorage timestamps
      let storedLast = lastActiveRef.current;
      try {
        const item = localStorage.getItem(LAST_ACTIVE_KEY);
        if (item) {
          const parsed = parseInt(item, 10);
          if (!isNaN(parsed) && parsed > storedLast) {
            storedLast = parsed;
            lastActiveRef.current = parsed;
          }
        }
      } catch {
        // ignore
      }

      const elapsed = Date.now() - storedLast;

      if (elapsed >= timeoutMs) {
        // Latch expired: show the Session Expired modal and stop tracking
        // activity. The actual logout is performed when the user clicks
        // through the modal (see SessionModals).
        expiredRef.current = true;
        setIsWarning(false);
        setIsExpired(true);
      } else if (elapsed >= timeoutMs - warningMs) {
        setIsWarning(true);
        setRemainingSeconds(Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000)));
      } else {
        setIsWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated, timeoutMs, warningMs, recordActivity]);

  return {
    isExpired,
    isWarning,
    remainingSeconds,
    extendSession,
  };
}

export default useSessionTimer;
