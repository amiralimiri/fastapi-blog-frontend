"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getErrorMessage, apiPath } from "@/lib/api";
import { AlertModal } from "@/components/Modal";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [p1, setP1] = useState(""),
    [p2, setP2] = useState(""),
    [msg, setMsg] = useState(""),
    [err, setErr] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setErr(
        "Invalid or missing reset token. Please request a new password reset.",
      );
      return;
    }
    if (p1 !== p2) {
      setErr("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(apiPath("/api/users/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: p1 }),
      });
      if (r.ok)
        setMsg(
          "Password reset successfully! You can now log in with your new password.",
        );
      else
        setErr(
          getErrorMessage(await r.json()) +
            " Please request a new password reset.",
        );
    } catch {
      setErr("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="content-section form-section">
        <h2>Reset Password</h2>
        <p>Enter your new password below.</p>
        {!token && (
          <p className="error-text">
            Invalid or missing reset token. Please request a new password reset.
          </p>
        )}
        <form onSubmit={submit}>
          <label>
            New Password
            <input
              type="password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              minLength={8}
              required
            />
            <small>Password must be at least 8 characters.</small>
          </label>
          <label>
            Confirm New Password
            <input
              type="password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <button className="btn primary" disabled={loading || !token}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <p className="form-links">
          Remember your password? <Link href="/login">Login here</Link>
        </p>
      </div>
      {msg && (
        <AlertModal
          kind="success"
          message={msg}
          onClose={() => {
            setMsg("");
            router.replace("/login");
          }}
        />
      )}
      {err && (
        <AlertModal kind="error" message={err} onClose={() => setErr("")} />
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
