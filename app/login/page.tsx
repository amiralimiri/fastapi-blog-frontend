"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, getErrorMessage, apiPath } from "@/lib/api";
import { AlertModal } from "@/components/Modal";
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("username", email);
      fd.append("password", password);
      const r = await fetch(apiPath("/api/users/token"), {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        setError(getErrorMessage(await r.json()));
        return;
      }
      const d = await r.json();
      setToken(d.access_token);
      router.replace("/");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="content-section form-section">
        <h2>Login</h2>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="btn primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="form-links">
          <p>
            <Link href="/forgot-password">Forgot your password?</Link>
          </p>
          <p>
            Don't have an account? <Link href="/register">Register here</Link>
          </p>
        </div>
      </div>
      {error && (
        <AlertModal kind="error" message={error} onClose={() => setError("")} />
      )}
    </>
  );
}
