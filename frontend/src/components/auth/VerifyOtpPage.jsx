
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import api from "../../services/api";
import { loginSuccess } from "../../features/authSlice";

export const VerifyOtpPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [resendAvailable, setResendAvailable] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // ✅ Get userName (and email if passed) from RegisterPage
  const { userName, email, mode } = location.state || {};

  // Redirect if userName is missing
  useEffect(() => {
    if (!userName) navigate("/register");
  }, [userName, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setResendAvailable(true);
    }
  }, [timer]);

  // New password state (for reset mode)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Handle OTP input
  const handleChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // ✅ Handle OTP Verification or Password Reset
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    if (mode === "reset") {
      if (!newPassword || newPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "reset") {
        const response = await api.post("/api/auth/reset-password", {
          userName,
          otp: enteredOtp,
          newPassword,
        });
        if (response.status === 200) {
          navigate("/login");
        }
      } else {
        const response = await api.post("/api/auth/verify-otp", {
          userName,
          otp: enteredOtp,
        });
        if (response.status === 200) {
          navigate("/login");
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || (mode === "reset" ? "Failed to reset password." : "Invalid OTP. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP (registration or reset)
  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setResendAvailable(false);
    try {
      if (mode === "reset") {
        await api.post("/api/auth/forgot-password-request", { userName });
      } else {
        await api.post("/api/auth/generate-otp", { userName });
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-indigo-100 p-4">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md transition-all">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
          {mode === "reset" ? "Reset Password" : "Verify Your Account"}
        </h1>

        <p className="text-gray-500 text-center text-sm mb-6 flex justify-center items-center gap-1">
          <Mail className="w-4 h-4 text-indigo-500" />
          {mode === "reset"
            ? "Enter the 6-digit code sent to your email and set a new password"
            : email
            ? (
                <>We sent a 6-digit code to <span className="font-semibold">{email}</span></>
              )
            : "Enter the 6-digit code sent to your email"}
        </p>

        {error && (
          <p className="text-red-500 text-center text-sm mb-3">{error}</p>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center space-y-6"
        >
          {/* OTP Inputs */}
          <div className="flex justify-between gap-3 w-full max-w-xs">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-12 text-center border-2 rounded-xl text-lg font-semibold text-gray-700 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              />
            ))}
          </div>

          {mode === "reset" && (
            <div className="w-full space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full pl-10 pr-10 py-2 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-gray-700 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-2 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-gray-700 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-semibold text-white rounded-xl transition-all ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <span className="flex justify-center items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> {mode === "reset" ? "Submitting..." : "Verifying..."}
              </span>
            ) : (
              <span className="flex justify-center items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {mode === "reset" ? "Reset Password" : "Verify OTP"}
              </span>
            )}
          </button>

          {/* Resend OTP Section */}
          <div className="text-center text-sm text-gray-600 mt-2">
            {resendAvailable ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-indigo-600 font-medium hover:underline"
              >
                Resend OTP
              </button>
            ) : (
              <p>
                Resend available in{" "}
                <span className="text-indigo-600 font-medium">{timer}s</span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
