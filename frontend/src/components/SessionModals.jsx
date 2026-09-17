import React from "react";
import { useNavigate } from "react-router-dom";

export default function SessionModals({
  isExpired,
  isWarning,
  remainingSeconds,
  extendSession,
  isDisplaced,
  claimSession,
  onLogout,
}) {
  const navigate = useNavigate();

  // Fire-and-forget logout raced with navigation and could leave the token
  // in localStorage — clear credentials deterministically before navigating.
  const handleGoToLogin = async () => {
    try {
      if (onLogout) await onLogout();
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("mwu_last_active_time");
    navigate("/login?reason=expired", { replace: true });
  };

  const handleDisplacedLogin = async () => {
    try {
      if (onLogout) await onLogout();
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login?reason=multitab", { replace: true });
  };

  // 1. Multiple Tab Conflict Overlay (Highest priority to prevent duplicate submissions)
  if (isDisplaced) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Multiple Tabs Detected
          </h3>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Your account is currently active in another browser tab. For
            security and to prevent conflicting approvals or submissions,
            single-user access is restricted to one tab at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={claimSession}
              type="button"
              className="flex-1 bg-mwu-blue hover:bg-mwu-blue-dark text-white font-medium py-2.5 px-4 rounded-xl shadow transition duration-150 text-sm"
            >
              Use This Tab Instead
            </button>
            <button
              onClick={handleDisplacedLogin}
              type="button"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition duration-150 text-sm"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Session Expired Modal
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Your Session Expired
          </h3>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Your session has expired due to inactivity. For your security, you
            have been automatically logged out. Please sign in again to
            continue.
          </p>

          <button
            onClick={handleGoToLogin}
            type="button"
            className="w-full bg-mwu-blue hover:bg-mwu-blue-dark text-white font-semibold py-3 px-4 rounded-xl shadow transition duration-150 text-sm"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  // 3. Session Expiring Warning Modal (60s countdown)
  if (isWarning) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-gray-950/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h4 className="text-lg font-bold text-gray-900 mb-1">
            Session Expiring Soon
          </h4>

          <p className="text-xs text-gray-600 mb-4">
            You will be logged out in{" "}
            <span className="font-bold text-red-600 text-sm">
              {remainingSeconds}
            </span>{" "}
            seconds due to inactivity.
          </p>

          <div className="flex gap-2">
            <button
              onClick={extendSession}
              type="button"
              className="flex-1 bg-mwu-blue hover:bg-mwu-blue-dark text-white text-xs font-semibold py-2.5 px-3 rounded-lg shadow transition"
            >
              Stay Logged In
            </button>
            <button
              onClick={handleGoToLogin}
              type="button"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium py-2.5 px-3 rounded-lg transition"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
