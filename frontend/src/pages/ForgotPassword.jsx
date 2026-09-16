import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.data.message || "Check your email for the reset token.");
      if (res.data.data?.reset_token) {
        setResetToken(res.data.data.reset_token);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Forgot Password
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {message}
        </div>
      )}

      {resetToken && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">
          <p className="font-medium">Reset Token (dev mode):</p>
          <code className="text-xs break-all">{resetToken}</code>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none"
            placeholder="Enter your email"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-mwu-blue text-white py-2.5 rounded-lg font-medium hover:bg-mwu-blue-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Token"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-mwu-blue hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
