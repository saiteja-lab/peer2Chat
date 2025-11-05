import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { validateUsername } from "../../utils/validation";

export const ForgotPasswordLink = ({ userName, onError, className }) => {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    onError && onError("");
    if (!validateUsername(userName)) {
      onError && onError("Please enter a valid username to reset password.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/auth/forgot-password-request", { userName });
      navigate("/verify-otp", { state: { userName, mode: "reset" } });
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to start password reset.";
      onError && onError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={className || "text-sm text-indigo-600 hover:underline"}
    >
      Forgot password?
    </button>
  );
};