import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, LogIn, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { validateUsername, validatePassword } from "../../utils/validation";
import { loginSuccess, updateUser } from "../../features/authSlice";
import { useDispatch } from "react-redux";
import { ForgotPasswordLink } from "./ForgotPassWordLink.jsx";
import { authService } from "../../services/authService";

export const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ userName: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { userName, password } = formData;

    if (!validateUsername(userName)) {
      setError("Please enter a valid username.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { userName, password });
      if (res.data) {
        dispatch(loginSuccess(res.data));
        try {
          const profile = await authService.getProfile(res.data.userName);
          if (profile) {
            dispatch(updateUser(profile));
          }
        } catch (_) {}
        navigate("/");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "";
      const lower = (msg || "").toLowerCase();
      if (lower.includes("verify")) {
        try {
          await api.post("/api/auth/generate-otp", { userName });
        } catch (_) {}
        navigate("/verify-otp", { state: { userName } });
        return;
      }
      setError(msg || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 relative overflow-hidden">
      {/* Floating background blobs */}
      <motion.div
        className="absolute w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 top-10 left-10 animate-pulse"
      />
      <motion.div
        className="absolute w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 bottom-10 right-10 animate-pulse"
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-md p-8 bg-white/80 backdrop-blur-md shadow-xl rounded-3xl border border-gray-200"
      >
        {/* Logo / Heading */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="text-blue-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-800">Peer2Chat</h1>
          </div>
          <p className="text-gray-500 text-sm">Welcome back! Sign in to continue</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-center mb-4 font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label
              htmlFor="userName"
              className={`block text-sm font-medium mb-2 ${
                focusedField === "userName" ? "text-indigo-600" : "text-gray-700"
              }`}
            >
              Username
            </label>
            <div className="relative">
              <User
                className={`absolute left-3 top-3 w-5 h-5 ${
                  focusedField === "userName"
                    ? "text-indigo-600"
                    : "text-gray-400"
                }`}
              />
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onFocus={() => setFocusedField("userName")}
                onBlur={() => setFocusedField("")}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full pl-10 pr-3 py-2 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-gray-700 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-2 ${
                focusedField === "password"
                  ? "text-indigo-600"
                  : "text-gray-700"
              }`}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className={`absolute left-3 top-3 w-5 h-5 ${
                  focusedField === "password"
                    ? "text-indigo-600"
                    : "text-gray-400"
                }`}
              />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-gray-700 transition-all"
              />
              <div
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 cursor-pointer text-gray-500 hover:text-indigo-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
            </div>
          </div>

          <div className="flex justify-end -mt-2 mb-1">
            <ForgotPasswordLink
              userName={formData.userName}
              onError={setError}
              className="text-sm text-indigo-600 hover:underline"
            />
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-semibold text-white rounded-xl shadow-md transition-all duration-300 ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <span className="flex justify-center items-center gap-2">
                <svg
                  className="animate-spin w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Logging In...
              </span>
            ) : (
              <span className="flex justify-center items-center gap-2">
                <LogIn className="w-5 h-5" /> Login
              </span>
            )}
          </motion.button>

          <p className="text-center text-gray-600 text-sm">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};
