"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { LogIn, Loader2, Mail, Lock } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const d = await authService.login(email, password);
      await login(d.access_token);
      toast.success("Welcome back!");
      router.replace("/");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Network error. Please check your connection and try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-section form-section max-w-md mx-auto">
      <title>Login | FastAPI Blog</title>
      <div className="flex items-center gap-2 mb-2">
        <LogIn className="text-steel" size={24} />
        <h2 className="text-2xl font-bold m-0">Login</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Sign in to your account to create posts and manage your profile.
      </p>

      {error && (
        <div className="p-3 mb-4 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <label>
          <span className="flex items-center gap-1.5 mb-1 text-sm font-medium">
            <Mail size={14} className="opacity-70" /> Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>
        <label>
          <span className="flex items-center gap-1.5 mb-1 text-sm font-medium">
            <Lock size={14} className="opacity-70" /> Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </label>
        <button
          className="btn primary w-full inline-flex items-center justify-center gap-2 mt-2"
          disabled={loading}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{loading ? "Logging in..." : "Login"}</span>
        </button>
      </form>

      <div className="form-links mt-6 pt-4 border-t border-border">
        <p className="mb-2">
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
        <p className="m-0 text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

