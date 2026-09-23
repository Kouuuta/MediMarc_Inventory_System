import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/",
});

// Add Authorization token from localStorage (if available)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Attach RESEND_API_KEY only for email-sending requests
    if (config.url.includes("/send-email")) {
      config.headers["x-resend-api-key"] = import.meta.env.VITE_RESEND_API_KEY;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle Unauthorized Response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Session expired. Redirecting to login...");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/"; // Redirect to login
    }
    return Promise.reject(error);
  }
);


export default api;