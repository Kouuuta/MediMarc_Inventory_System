import { useEffect, useState } from "react";
import "../styles/ActivityLog.css";
import api from "../services/api";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          console.error("No token found! Please log in.");
          setError("You must be logged in to view activity logs.");
          setLoading(false);
          return;
        }

        const response = await api.get("/activity-logs/");

        if (Array.isArray(response.data)) {
          setLogs(response.data);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error("Failed to fetch activity logs:", err);
        setError("Failed to load logs. Please log in again.");
        localStorage.removeItem("access_token");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="activity-log-container">
      <h2 className="activity-log-title">Activity Log</h2>

      {loading && <p>Loading logs...</p>}
      {error && <p className="activity-log-error">{error}</p>}

      <div className="activity-log-table-wrapper">
        <table className="activity-log-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Action</th>
              <th>Page</th>
              <th>Date and Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0
              ? logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.username}</td>
                    <td>{log.role}</td>
                    <td
                      className={`p-2 border action-${log.action.toLowerCase()}`}
                    >
                      {log.action}
                    </td>
                    <td>{log.page}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              : !loading && (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No activity logs available.
                    </td>
                  </tr>
                )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLog;
