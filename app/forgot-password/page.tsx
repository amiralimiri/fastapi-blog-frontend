"use client";
import Link from "next/link";
import { useState } from "react";
import { getErrorMessage, apiPath } from "@/lib/api";
import { AlertModal } from "@/components/Modal";
export default function Forgot() {
  const [email, setEmail] = useState(""),
    [msg, setMsg] = useState(""),
    [err, setErr] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(apiPath("/api/users/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (r.ok) {
        setMsg(
          "If an account exists with this email, you will receive password reset instructions shortly.",
        );
        setEmail("");
      } else setErr(getErrorMessage(await r.json()));
    } catch {
      setErr("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="content-section form-section">
        <h2>Forgot Password</h2>
        <p>
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <button className="btn primary" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="form-links">
          Remember your password? <Link href="/login">Login here</Link>
        </p>
      </div>
      {msg && (
        <AlertModal kind="success" message={msg} onClose={() => setMsg("")} />
      )}{" "}
      {err && (
        <AlertModal kind="error" message={err} onClose={() => setErr("")} />
      )}
    </>
  );
}
