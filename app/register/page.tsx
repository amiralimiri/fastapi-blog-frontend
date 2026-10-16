"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage, apiPath } from "@/lib/api";
import { toast } from "sonner";
import { UserPlus, Loader2, User as UserIcon, Mail, Lock } from "lucide-react";

export default function Register() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const r = await fetch(apiPath("/api/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!r.ok) {
        const msg = getErrorMessage(await r.json());
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Account created successfully! You can now log in.");
      router.replace("/login");
    } catch {
      const msg = "Network error. Please check your connection and try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-section form-section max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="text-steel" size={24} />
        <h2 className="text-2xl font-bold m-0">Register</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Create a new account to join the community and start posting.
      </p>

      {error && (
        <div className="p-3 mb-4 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <label>
          <span className="flex items-center gap-1.5 mb-1 text-sm font-medium">
            <UserIcon size={14} className="opacity-70" /> Username
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={1}
            maxLength={50}
            placeholder="johndoe"
            required
            autoComplete="username"
          />
        </label>
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
            minLength={8}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
          />
          <small className="text-muted-foreground text-xs mt-0.5 block">
            Must be at least 8 characters.
          </small>
        </label>
        <label>
          <span className="flex items-center gap-1.5 mb-1 text-sm font-medium">
            <Lock size={14} className="opacity-70" /> Confirm Password
          </span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            placeholder="Repeat your password"
            required
            autoComplete="new-password"
          />
          {mismatch && (
            <span className="text-red-500 text-xs mt-1 block">
              Passwords do not match.
            </span>
          )}
        </label>
        <button
          className="btn primary w-full inline-flex items-center justify-center gap-2 mt-2"
          disabled={loading || mismatch}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{loading ? "Registering..." : "Register"}</span>
        </button>
      </form>

      <p className="form-links mt-6 pt-4 border-t border-border text-sm m-0">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold underline">
          Login here
        </Link>
      </p>
    </div>
  );
}

