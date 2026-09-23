import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [resetLink] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/forgot-password/", { email });
      toast.message("Reset link has been sent!", {
        description: "You may check your gmail.",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
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
      }
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to receive a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive mb-4 text-center text-sm">{error}</p>
          )}

          {!resetLink ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2Icon className="animate-spin" />}
                Get Reset Link
              </Button>
            </form>
          ) : (
            <div className="bg-muted flex flex-col gap-2 rounded-md p-4 text-sm">
              <p>Click the link below to reset your password:</p>
              <a
                href={resetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary break-all hover:underline"
              >
                {resetLink}
              </a>
            </div>
          )}

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

export default ForgotPassword;