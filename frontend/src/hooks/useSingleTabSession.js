import { useState, useEffect, useCallback, useRef } from "react";

const TAB_STORAGE_KEY = "mwu_session_tab_id";
const ACTIVE_TAB_KEY = "mwu_active_tab_id";
const CHANNEL_NAME = "mwu_tab_session_channel";

// Get or create unique tab ID for this browser tab
export function getTabId() {
  let id = sessionStorage.getItem(TAB_STORAGE_KEY);
  if (!id) {
    id = "tab_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, id);
    } catch {
      // ignore storage errors
    }
  }
  return id;
}

export function useSingleTabSession(isAuthenticated, user) {
  const tabIdRef = useRef(getTabId());
  const [isDisplaced, setIsDisplaced] = useState(false);
  const channelRef = useRef(null);

  // Claim ownership of active session for this tab
  const claimSession = useCallback(() => {
    const currentTabId = tabIdRef.current;
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, currentTabId);
    } catch {
      // ignore
    }

    if (channelRef.current) {
      try {
        channelRef.current.postMessage({
          type: "CLAIM_SESSION",
          tabId: currentTabId,
          userId: user?.id,
        });
      } catch {
        // ignore
      }
    }

    setIsDisplaced(false);
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsDisplaced(false);
      return;
    }

    const currentTabId = tabIdRef.current;

    // Check if another tab is currently active
    const activeTab = localStorage.getItem(ACTIVE_TAB_KEY);
    if (activeTab && activeTab !== currentTabId) {
      // Another tab was already active before this one claimed it
      // Automatically claim this tab as the active one and inform the previous tab
      claimSession();
    } else {
      claimSession();
    }

    // Initialize BroadcastChannel
    let bc = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = bc;

        bc.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          if (data.type === "CLAIM_SESSION" && data.tabId !== currentTabId) {
            // Another tab has claimed the session!
            setIsDisplaced(true);
          }
        };
      } catch {
        // Fallback to storage events
      }
    }

    // Storage event listener (cross-tab fallback)
    const handleStorageChange = (e) => {
      if (e.key === ACTIVE_TAB_KEY) {
        if (e.newValue && e.newValue !== currentTabId) {
          setIsDisplaced(true);
        } else if (e.newValue === currentTabId) {
          setIsDisplaced(false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Clean up when tab is closed
    const handleUnload = () => {
      if (localStorage.getItem(ACTIVE_TAB_KEY) === currentTabId) {
        localStorage.removeItem(ACTIVE_TAB_KEY);
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("beforeunload", handleUnload);
      if (bc) {
        bc.close();
      }
    };
  }, [isAuthenticated, claimSession]);

  return {
    tabId: tabIdRef.current,
    isDisplaced,
    claimSession,
  };
}

export default useSingleTabSession;
