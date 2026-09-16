import { useState, useEffect, useCallback, useRef } from "react";

// Default: 15 minutes inactivity timeout, warning at 60 seconds remaining
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_WARNING_MS = 60 * 1000;
const LAST_ACTIVE_KEY = "mwu_last_active_time";

export function useSessionTimer({
  isAuthenticated,
  onExpire,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningMs = DEFAULT_WARNING_MS,
}) {
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.round(warningMs / 1000),
  );

  const lastActiveRef = useRef(Date.now());
  const lastThrottleRef = useRef(Date.now());

  // Record user activity
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;

    // Throttle writing to localStorage to once every 10 seconds
    if (now - lastThrottleRef.current > 10000) {
      lastThrottleRef.current = now;
      try {
        localStorage.setItem(LAST_ACTIVE_KEY, String(now));
      } catch {
        // ignore
      }
    }

    if (isWarning) {
      setIsWarning(false);
    }
  }, [isWarning]);

  // Extend / reset the timer manually (e.g. from warning modal)
  const extendSession = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;
    lastThrottleRef.current = now;
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
      return;
    }

    // Initialize last active time
    const now = Date.now();
    lastActiveRef.current = now;
    try {
      localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    } catch {
      // ignore
    }

    // User activity events
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => {
      if (!isExpired) {
        recordActivity();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check timer every second
    const interval = setInterval(() => {
      // Check both in-memory and localStorage timestamps for multi-tab sync
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
        setIsExpired(true);
        setIsWarning(false);
        if (onExpire) {
          onExpire();
        }
      } else if (elapsed >= timeoutMs - warningMs) {
        setIsWarning(true);
        const secsLeft = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setRemainingSeconds(secsLeft);
      } else {
        if (isWarning) {
          setIsWarning(false);
        }
      }
    }, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [
    isAuthenticated,
    timeoutMs,
    warningMs,
    onExpire,
    recordActivity,
    isExpired,
    isWarning,
  ]);

  return {
    isExpired,
    isWarning,
    remainingSeconds,
    extendSession,
  };
}

export default useSessionTimer;
