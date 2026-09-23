import { useState, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardPath } from "../utils/helpers";
import { API_BASE_URL } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const reason = searchParams.get("reason");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user, must_change_password } = await login(email, password);
      if (must_change_password) {
        navigate("/force-change-password", { replace: true });
      } else {
        const dashPath = getDashboardPath(user.role?.code);
        navigate(dashPath, { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <img
          src={`${API_BASE_URL}/logo`}
          alt="MWU Logo"
          className="w-20 h-20 mx-auto mb-3"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
      </div>

      {reason === "expired" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2.5">
          <svg
            className="w-5 h-5 shrink-0 text-amber-500"
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
          <span>
            Your session expired due to inactivity. Please sign in again.
          </span>
        </div>
      )}

      {reason === "multitab" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2.5">
          <svg
            className="w-5 h-5 shrink-0 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Signed out because another browser tab became active.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email or Student ID
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none transition-all"
            placeholder="username@mwu.edu.et or Student ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none transition-all"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-mwu-blue text-white py-2.5 rounded-lg font-medium hover:bg-mwu-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/forgot-password"
          className="text-sm text-mwu-blue hover:underline"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
