"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getErrorMessage, apiPath } from "@/lib/api";
import { toast } from "sonner";
import { KeyRound, Lock, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch = p2.length > 0 && p1 !== p2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      const errorMsg = "Invalid or missing reset token. Please request a new password reset.";
      setErr(errorMsg);
      toast.error(errorMsg);
      return;
    }
    if (p1 !== p2) {
      const errorMsg = "Passwords do not match.";
      setErr(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setErr("");
    setMsg("");

    try {
      const r = await fetch(apiPath("/api/users/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: p1 }),
      });

      if (r.ok) {
        const successMsg =
          "Password reset successfully! You can now log in with your new password.";
        setMsg(successMsg);
        toast.success(successMsg);
        setTimeout(() => {
          router.replace("/login");
        }, 1500);
      } else {
        const errorMsg =
          getErrorMessage(await r.json()) +
          " Please request a new password reset.";
        setErr(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Network error. Please check your connection and try again.";
      setErr(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-section form-section max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="text-steel" size={24} />
        <h2 className="text-2xl font-bold m-0">Reset Password</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Enter your new password below.</p>

      {!token && (
        <div className="p-3 mb-4 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm">
          Invalid or missing reset token. Please request a new password reset.
        </div>
      )}

      {msg && (
        <div className="p-4 mb-4 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 text-sm flex items-start gap-2.5">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <span>{msg}</span>
        </div>
      )}

      {err && (
        <div className="p-3 mb-4 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={submit}>
        <label>
          <span className="flex items-center gap-1.5 mb-1 text-sm font-medium">
            <Lock size={14} className="opacity-70" /> New Password
          </span>
          <input
            type="password"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            minLength={8}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
          />
          <small className="text-muted-foreground text-xs mt-0.5 block">
            Password must be at least 8 characters.
          </small>
        </label>
        <label>
          <span className="flex items-center gap-1.5 mb-1 text-sm font-medium">
            <Lock size={14} className="opacity-70" /> Confirm New Password
          </span>
          <input
            type="password"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            minLength={8}
            placeholder="Repeat new password"
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
          disabled={loading || !token || mismatch}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{loading ? "Resetting..." : "Reset Password"}</span>
        </button>
      </form>

      <p className="form-links mt-6 pt-4 border-t border-border text-sm m-0">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold underline inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="loading">Loading reset form...</div>}>
      <ResetForm />
    </Suspense>
  );
}

