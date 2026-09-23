import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { getDashboardPath } from "../utils/helpers";
import { API_BASE_URL } from "../services/api";

export default function ForceChangePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forceChangePassword({
        password,
        password_confirmation: confirmPassword,
      });

      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const dashPath = getDashboardPath(user?.role?.code);
      navigate(dashPath, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to change password. Please try again.",
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
        <h2 className="text-2xl font-bold text-gray-800">Change Your Password</h2>
        <p className="text-sm text-gray-500 mt-1">
          You must change your password before continuing.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none transition-all"
            placeholder="Enter new password (min 8 characters)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none transition-all"
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-mwu-blue text-white py-2.5 rounded-lg font-medium hover:bg-mwu-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
