"use client";

import Link from "next/link";
import { useState } from "react";
import { backend, BackendError } from "@/lib/backend";
import { toast } from "sonner";
import { KeyRound, Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");

    try {
      await backend.auth.forgotPassword(email);
      const successMessage =
        "If an account exists with this email, you will receive password reset instructions shortly.";
      setMsg(successMessage);
      toast.success("Reset link sent!");
      setEmail("");
    } catch (error: unknown) {
      const errorMsg =
        error instanceof BackendError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Network error. Please check your connection and try again.";
      setErr(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-section form-section max-w-md mx-auto">
      <title>Forgot Password | FastAPI Blog</title>
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="text-steel" size={24} />
        <h2 className="text-2xl font-bold m-0">Forgot Password</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

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
            <Mail size={14} className="opacity-70" /> Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </label>
        <button
          className="btn primary w-full inline-flex items-center justify-center gap-2 mt-2"
          disabled={loading}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{loading ? "Sending..." : "Send Reset Link"}</span>
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

