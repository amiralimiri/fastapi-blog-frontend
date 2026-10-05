"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage, apiPath } from "@/lib/api";
import { AlertModal } from "@/components/Modal";
export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const mismatch = confirm.length > 0 && password !== confirm;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(apiPath("/api/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!r.ok) {
        setError(getErrorMessage(await r.json()));
        return;
      }
      setError("");
      router.replace("/login");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="content-section form-section">
        <h2>Register</h2>
        <form onSubmit={submit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={1}
              maxLength={50}
              required
            />
          </label>
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
              minLength={8}
              required
            />
            <small>Must be at least 8 characters.</small>
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
            {mismatch && (
              <span className="error-text">Passwords do not match.</span>
            )}
          </label>
          <button className="btn primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="form-links">
          Already have an account? <Link href="/login">Login here</Link>
        </p>
      </div>
      {error && (
        <AlertModal kind="error" message={error} onClose={() => setError("")} />
      )}
    </>
  );
}
