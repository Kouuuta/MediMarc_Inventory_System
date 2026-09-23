import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";
import { toast } from "sonner";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState(""); // State for holding inputted email
  const [resetLink] = useState(""); // State for storing the reset link
  const [error, setError] = useState(""); // State for error messages
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("🔍 Debug: Sending forgot password request...");

      const response = await api.post("/forgot-password/", { email });
      toast.message(
        "Reset link has been sent!:",
        { description: "You may check your gmail." },
        response.data.reset_link
      );
    } catch (error) {
      console.error(
        "❌ Debug: Forgot password error:",
        error.response?.data || error.message
      );

      if (error.response) {
        toast.error(error.response.data.error || "Failed to send reset link.", {
          duration: 2000,
        });
      } else {
        toast.error("Something went wrong. Please try again.", {
          duration: 2000,
        });
        setLoading(false);
      }
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h2>Forgot Password</h2>
        <p>Enter your email to receive a reset link</p>

        {error && <p className="error">{error}</p>}

        {!resetLink ? (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Get Reset Link"}
            </button>
          </form>
        ) : (
          <div className="reset-link-box">
            <p>Click the link below to reset your password:</p>
            <a href={resetLink} target="_blank" rel="noopener noreferrer">
              {resetLink}
            </a>
          </div>
        )}

        <button className="back-to-login" onClick={() => navigate("/")}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
