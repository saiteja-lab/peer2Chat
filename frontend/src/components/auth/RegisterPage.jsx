import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, MessageSquare, Loader2 } from "lucide-react";
import api from "../../services/api";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/validation";

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const navigate = useNavigate();

  const calculatePasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z\d]/.test(pass)) strength++;
    return Math.min(strength, 4);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { userName, email, password, confirmPassword } = formData;

    if (!validateUsername(userName)) return setError("Enter a valid username.");
    if (!validateEmail(email)) return setError("Invalid email address.");
    if (!validatePassword(password)) return setError("Weak password.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    if (!agreedToTerms)
      return setError("You must agree to the terms and conditions.");

    setLoading(true);
    try {
      const response = await api.post("/api/auth/register", {
        userName,
        email,
        password,
      });
      const otp = response.data.otp;
      // console.log(res.data)
      navigate("/verify-otp", { state: { userName, otp } });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Try again!";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (level) => {
    switch (level) {
      case 1:
        return "bg-red-500 w-1/4";
      case 2:
        return "bg-yellow-500 w-2/4";
      case 3:
        return "bg-blue-500 w-3/4";
      case 4:
        return "bg-green-500 w-full";
      default:
        return "bg-gray-300 w-0";
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-200 via-white to-purple-200 overflow-hidden p-4">
      {/* Floating Chat Bubbles */}
      <div className="absolute top-10 left-10 text-indigo-300 animate-bounce">
        <MessageSquare size={36} />
      </div>
      <div className="absolute bottom-10 right-10 text-purple-300 animate-pulse">
        <MessageSquare size={40} />
      </div>

      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border border-gray-100 transition-all hover:shadow-indigo-300/50">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
          Create Your Chat Account
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Join and start chatting instantly with peers!
        </p>

        {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div
            className={`flex items-center border rounded-xl px-3 py-2 transition-all ${
              focusedField === "userName"
                ? "border-indigo-500 shadow-md"
                : "border-gray-300"
            }`}
          >
            <User className="text-gray-400 mr-2" />
            <input
              type="text"
              name="userName"
              placeholder="Username"
              value={formData.userName}
              onFocus={() => setFocusedField("userName")}
              onBlur={() => setFocusedField("")}
              onChange={handleChange}
              className="w-full outline-none bg-transparent"
              required
            />
          </div>

          {/* Email */}
          <div
            className={`flex items-center border rounded-xl px-3 py-2 transition-all ${
              focusedField === "email"
                ? "border-indigo-500 shadow-md"
                : "border-gray-300"
            }`}
          >
            <Mail className="text-gray-400 mr-2" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              onChange={handleChange}
              className="w-full outline-none bg-transparent"
              required
            />
          </div>

          {/* Password */}
          <div
            className={`flex items-center border rounded-xl px-3 py-2 transition-all relative ${
              focusedField === "password"
                ? "border-indigo-500 shadow-md"
                : "border-gray-300"
            }`}
          >
            <Lock className="text-gray-400 mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              onChange={handleChange}
              className="w-full outline-none bg-transparent"
              required
            />
            {showPassword ? (
              <EyeOff
                className="cursor-pointer text-gray-400"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <Eye
                className="cursor-pointer text-gray-400"
                onClick={() => setShowPassword(true)}
              />
            )}
            {/* Tooltip */}
            <div className="absolute -bottom-8 left-0 text-xs text-gray-400">
              Min 6 chars, upper & lower case, number, symbol
            </div>
          </div>

          {/* Password Strength Bar */}
          <div className="w-full pt-4 bg-gray-100 rounded-full h-1.5 mt-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ${getStrengthColor(
                passwordStrength
              )}`}
            ></div>
          </div>

          {/* Confirm Password */}
          <div
            className={`flex items-center border rounded-xl px-3 py-2 transition-all ${
              focusedField === "confirmPassword"
                ? "border-indigo-500 shadow-md"
                : "border-gray-300"
            }`}
          >
            <Lock className="text-gray-400 mr-2" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField("")}
              onChange={handleChange}
              className="w-full outline-none bg-transparent"
              required
            />
            {showConfirmPassword ? (
              <EyeOff
                className="cursor-pointer text-gray-400"
                onClick={() => setShowConfirmPassword(false)}
              />
            ) : (
              <Eye
                className="cursor-pointer text-gray-400"
                onClick={() => setShowConfirmPassword(true)}
              />
            )}
          </div>

          {/* Terms */}
          <div className="flex items-center text-sm">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mr-2 accent-indigo-600"
            />
            <label htmlFor="terms">
              I agree to the{" "}
              <Link to="/terms" className="text-indigo-600 hover:underline">
                Terms & Conditions
              </Link>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-2 text-white font-semibold rounded-xl transition-all flex justify-center items-center gap-2 ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Registering...
              </>
            ) : (
              "Register"
            )}
          </button>
        </form>

        {/* Login Redirect */}
        <p className="text-center text-gray-600 text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};
