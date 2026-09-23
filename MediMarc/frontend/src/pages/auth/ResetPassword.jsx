import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/layout/AuthLayout";
import api from "@/lib/api";

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Optional: Validate the token here if needed
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Both password fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/reset-password/${uidb64}/${token}/`, {
        password,
      });

      toast.success("Password reset successful! Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error(
        "Reset Password Error:",
        err.response?.data || err.message
      );
      toast.error(err.response?.data?.error || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2Icon className="animate-spin" />}
              Reset Password
            </Button>
          </form>
          <Button
            variant="ghost"
            className="mt-4 w-full"
            onClick={() => navigate("/")}
          >
            <ArrowLeftIcon />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default ResetPassword;