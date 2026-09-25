"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    grecaptcha: {
      render: (container: HTMLElement, options: object) => number;
      getResponse: (widgetId: number) => string;
      reset: (widgetId: number) => void;
    };
    onRecaptchaLoad: () => void;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);
  const [captchaDone, setCaptchaDone] = useState(false);
  const captchaRef  = useRef<HTMLDivElement>(null);
  const widgetId    = useRef<number | null>(null);

  useEffect(() => {
    // Load reCAPTCHA script once
    if (document.getElementById("recaptcha-script")) {
      renderWidget();
      return;
    }
    window.onRecaptchaLoad = renderWidget;
    const script = document.createElement("script");
    script.id  = "recaptcha-script";
    script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  function renderWidget() {
    if (!captchaRef.current || widgetId.current !== null) return;
    widgetId.current = window.grecaptcha.render(captchaRef.current, {
      sitekey:  "6LdHXs4tAAAAAADoo24YUJJvSPKAIQ5M6bgbJQiC",
      callback: () => setCaptchaDone(true),
      "expired-callback": () => setCaptchaDone(false),
      "error-callback":   () => setCaptchaDone(false),
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const token = widgetId.current !== null
      ? window.grecaptcha.getResponse(widgetId.current)
      : "";

    if (!token) {
      setError("Please complete the 'I am not a robot' check.");
      return;
    }

    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username:       form.get("username"),
        password:       form.get("password"),
        captchaToken:   token,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Unable to sign in.");
      setBusy(false);
      // Reset captcha so user must tick again
      if (widgetId.current !== null) {
        window.grecaptcha.reset(widgetId.current);
        setCaptchaDone(false);
      }
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
          <div className="login-stat"><strong>Live</strong><span>Vehicle tracking</span></div>
          <div className="login-stat-divider" />
          <div className="login-stat"><strong>4-day</strong><span>Validity window</span></div>
          <div className="login-stat-divider" />
          <div className="login-stat"><strong>Instant</strong><span>Overdue alerts</span></div>
        </div>
      </section>

      <section className="login-card">
        <div className="brand-mark">RW</div>
        <h2>Welcome back</h2>
        <p className="muted">Sign in to your tracking desk.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit} className="stack-form">
          <label>
            Username
            <input name="username" autoComplete="username" required autoFocus />
          </label>
          <label>
            Password
            <input type="password" name="password" autoComplete="current-password" required />
          </label>

          {/* reCAPTCHA widget */}
          <div className="recaptcha-wrap">
            <div ref={captchaRef} />
          </div>

          <button
            className="button button-primary"
            type="submit"
            disabled={busy || !captchaDone}
          >
            {busy ? "Signing in…" : "Sign in"} <span>→</span>
          </button>
        </form>
      </section>
    </main>
  );
}
