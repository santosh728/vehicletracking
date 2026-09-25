"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password")
      })
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Unable to sign in.");
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="login-shell">
      <section className="login-intro">
        <div className="login-logo">
          <span className="login-logo-mark">RW</span>
          <span className="login-logo-name">RouteWatch</span>
        </div>
        <h1>Every vehicle.<br />Every delivery.<br />On time.</h1>
        <p>Real-time bill validity tracking, overdue alerts, and full warehouse visibility — all from one clean dashboard.</p>
        <div className="intro-rule" />
        <div className="login-stats">
          <div className="login-stat">
            <strong>Live</strong>
            <span>Vehicle tracking</span>
          </div>
          <div className="login-stat-divider" />
          <div className="login-stat">
            <strong>4-day</strong>
            <span>Validity window</span>
          </div>
          <div className="login-stat-divider" />
          <div className="login-stat">
            <strong>Instant</strong>
            <span>Overdue alerts</span>
          </div>
        </div>
      </section>
      <section className="login-card">
        <div className="brand-mark">RW</div>
        <h2>Welcome back</h2>
        <p className="muted">Sign in to your tracking desk.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit} className="stack-form">
          <label>Username<input name="username" autoComplete="username" required autoFocus /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"} <span>→</span>
          </button>
        </form>
      </section>
    </main>
  );
}
