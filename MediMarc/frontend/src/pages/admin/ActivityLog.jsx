import { useEffect, useState } from "react";
import { AlertTriangleIcon } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import api from "@/lib/api";

const ACTION_VARIANT = {
  create: "success",
  add: "success",
  update: "default",
  edit: "default",
  delete: "destructive",
};

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
    <>
      <PageHeader
        title="Activity Log"
        description="Track user activity across the system"
      />

      {error && (
        <div className="text-destructive bg-destructive/5 border-destructive/20 mb-6 flex items-center gap-2 rounded-md border px-4 py-3 text-sm">
          <AlertTriangleIcon className="size-4" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Username</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Action</th>
                    <th className="py-2 pr-4 font-medium">Page</th>
                    <th className="py-2 font-medium">Date and Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{log.username}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {log.role}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            ACTION_VARIANT[log.action?.toLowerCase()] ||
                            "secondary"
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {log.page}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No activity logs available"
              description="Activities will appear here once users start interacting with the system."
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ActivityLog;