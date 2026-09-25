"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { SessionUser } from "../../lib/auth";

type User = {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  username: string;
  role: string;
  vehicleCount: number;
};

function TruckSpinner() {
  return (
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="truck-anim">
          <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="truck-svg">
            <rect x="2" y="10" width="36" height="16" rx="2" fill="#2c8b61" />
            <rect x="38" y="14" width="18" height="12" rx="2" fill="#1b6e4d" />
            <rect x="40" y="16" width="8" height="6" rx="1" fill="#a8e6c8" />
            <circle cx="12" cy="27" r="4" fill="#18231f" />
            <circle cx="12" cy="27" r="2" fill="#d7eddf" />
            <circle cx="48" cy="27" r="4" fill="#18231f" />
            <circle cx="48" cy="27" r="2" fill="#d7eddf" />
            <rect x="2" y="18" width="6" height="4" rx="1" fill="#a8e6c8" />
          </svg>
          <div className="truck-road" />
        </div>
        <p className="loader-text">Creating account…</p>
      </div>
    </div>
  );
}

export default function UsersPanel({ session }: { session: SessionUser }) {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch("/api/users");
    const result = await response.json();
    if (response.ok) setUsers(result.users);
    else setError(result.error || "Unable to load users.");
  }

  useEffect(() => { void load(); }, []);

  function validate(data: Record<string, string>) {
    const errs: Record<string, string> = {};
    if (!data.fullName?.trim()) errs.fullName = "Full name is required.";
    if (!data.email?.includes("@")) errs.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test(data.mobile || "")) errs.mobile = "Mobile number must be exactly 10 digits.";
    if (!data.address?.trim()) errs.address = "Address is required.";
    if (!data.username?.trim()) errs.username = "Username is required.";
    if ((data.password || "").length < 6) errs.password = "Password must be at least 6 characters.";
    return errs;
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;

    const errs = validate(data);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setBusy(true);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(result.error || "Unable to create user.");
    } else {
      setMessage(`Account for "${data.fullName}" created successfully.`);
      (event.target as HTMLFormElement).reset();
      setFieldErrors({});
      await load();
    }
  }

  return (
    <>
      {busy && <TruckSpinner />}
      <div className="app-shell">
        <aside className="sidebar">
          <Link className="brand" href="/">
            <span className="brand-mark">RW</span>
            <span>
              <strong>RouteWatch</strong>
              <small>warehouse control</small>
            </span>
          </Link>
          <nav>
            <Link className="nav-link" href="/">
              <span className="nav-icon">⊞</span>Tracking desk
            </Link>
            <Link className="nav-link active" href="/users">
              <span className="nav-icon">⊞</span>Manage users
            </Link>
          </nav>
          <div className="sidebar-footer">
            <span className="status-dot" /> Super admin
            <br />
            <small>Full system access</small>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <span className="eyebrow">ADMINISTRATION / ACCESS</span>
              <h1>Manage users</h1>
            </div>
            <div className="user-menu">
              <span className="avatar">SA</span>
              <span className="user-details">
                <strong>{session.fullName || session.username}</strong>
                <small>{session.mobile}</small>
              </span>
              <Link href="/">Back</Link>
            </div>
          </header>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="content-grid">
            {/* Users table */}
            <section className="panel table-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">ACCOUNT DIRECTORY</span>
                  <h2>System users</h2>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Full name</th>
                      <th>Contact</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Vehicles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-state">
                            <div className="empty-icon">👤</div>
                            <h3>No users yet</h3>
                            <p>Create the first user using the form.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>
                          <strong>{user.fullName || "Profile incomplete"}</strong>
                          <small>{user.address}</small>
                        </td>
                        <td>
                          {user.email}
                          <small>{user.mobile}</small>
                        </td>
                        <td>{user.username}</td>
                        <td>
                          <span className={`badge ${user.role === "super_admin" ? "badge-on-track" : "badge-due-soon"}`}>
                            <span />
                            {user.role === "super_admin" ? "Super admin" : "User"}
                          </span>
                        </td>
                        <td>{user.vehicleCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Create user form */}
            <section className="panel add-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">NEW ACCOUNT</span>
                  <h2>Create user</h2>
                </div>
              </div>
              <form onSubmit={create} className="vehicle-form" noValidate>
                <label>
                  Full name <span className="req">*</span>
                  <input name="fullName" placeholder="e.g. Ramesh Kumar" />
                  {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
                </label>

                <label>
                  Email address <span className="req">*</span>
                  <input type="email" name="email" placeholder="e.g. ramesh@example.com" />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </label>

                <label>
                  Mobile number <span className="req">*</span>
                  <input
                    name="mobile"
                    placeholder="10-digit number"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="\d{10}"
                  />
                  {fieldErrors.mobile && <span className="field-error">{fieldErrors.mobile}</span>}
                </label>

                <label>
                  Address <span className="req">*</span>
                  <textarea name="address" rows={2} placeholder="Full address" />
                  {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
                </label>

                <label>
                  Username <span className="req">*</span>
                  <input name="username" placeholder="e.g. ramesh_k" autoComplete="off" />
                  {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
                </label>

                <label>
                  Password <span className="req">*</span>
                  <input type="password" name="password" placeholder="Min. 6 characters" autoComplete="new-password" />
                  {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                </label>

                <label>
                  Role <span className="req">*</span>
                  <select name="role" defaultValue="user">
                    <option value="user">User</option>
                    <option value="super_admin">Super admin</option>
                  </select>
                </label>

                <button className="button button-primary" type="submit" disabled={busy}>
                  {busy ? "Creating…" : "Create account"} <span>→</span>
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
