import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";
import { toast } from "sonner";
import api from "../services/api";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/home");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/login/", {
        username,
        password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      toast.success(" Login successful! Redirecting...", {
        duration: 1000,
      });

      setTimeout(() => {
        window.location.href = "/home";
      }, 2000);
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);

      toast.error(error.response?.data?.error || "Invalid credentials", {
        duration: 1000,
      });
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/logo.png" alt="Medimarc Logo" className="login-logo" />
        <form onSubmit={handleLogin}>
          <label>Username</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <span className="spinner"></span> : "Login"}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <a href="/forgot-password" className="forgot-password">
          Forgot password?
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
