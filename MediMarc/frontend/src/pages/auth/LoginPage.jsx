import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
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

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

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

      toast.success("Login successful! Redirecting...", {
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
    <AuthLayout>
      <Card>
        <CardHeader className="items-center text-center">
          <img
            src="/logo.png"
            alt="MediMarc logo"
            className="size-14 object-contain"
          />
          <CardTitle className="text-xl">MediMarc Inventory</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2Icon className="animate-spin" />}
              Login
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-primary text-sm hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default LoginPage;