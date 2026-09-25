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

type EditForm = {
  fullName: string; email: string; mobile: string;
  address: string; username: string; role: string; password: string;
};

function TruckSpinner({ text }: { text: string }) {
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
        <p className="loader-text">{text}</p>
      </div>
    </div>
  );
}

export default function UsersPanel({ session }: { session: SessionUser }) {
  const [users, setUsers]           = useState<User[]>([]);
  const [search, setSearch]         = useState("");
  const [error, setError]           = useState("");
  const [message, setMessage]       = useState("");
  const [busy, setBusy]             = useState(false);
  const [busyText, setBusyText]     = useState("Please wait…");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // editing state
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditForm>({ fullName:"", email:"", mobile:"", address:"", username:"", role:"user", password:"" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users);
    else setError(data.error || "Unable to load users.");
  }
  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) || u.mobile.includes(q);
  });

  /* ── Create ── */
  function validateCreate(d: Record<string, string>) {
    const e: Record<string, string> = {};
    if (!d.fullName?.trim())            e.fullName = "Full name is required.";
    if (!d.email?.includes("@"))        e.email    = "Enter a valid email address.";
    if (!/^\d{10}$/.test(d.mobile||"")) e.mobile   = "Mobile must be exactly 10 digits.";
    if (!d.address?.trim())             e.address  = "Address is required.";
    if (!d.username?.trim())            e.username = "Username is required.";
    if ((d.password||"").length < 6)    e.password = "Password must be at least 6 characters.";
    return e;
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage(""); setFieldErrors({});
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string,string>;
    const errs = validateCreate(data);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setBusy(true); setBusyText("Creating account…");
    const res = await fetch("/api/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
    const result = await res.json();
    setBusy(false);
    if (!res.ok) { setError(result.error || "Unable to create user."); return; }
    setMessage(`Account for "${data.fullName}" created.`);
    (event.target as HTMLFormElement).reset();
    await load();
  }

  /* ── Delete ── */
  async function deleteUser(user: User) {
    if (!confirm(`Delete "${user.fullName || user.username}"? This cannot be undone.`)) return;
    setBusy(true); setBusyText("Deleting user…");
    const res = await fetch(`/api/users/${user._id}`, { method:"DELETE" });
    const result = await res.json();
    setBusy(false);
    if (!res.ok) { setError(result.error || "Unable to delete user."); return; }
    setMessage(`User "${user.fullName || user.username}" deleted.`);
    setUsers(prev => prev.filter(u => u._id !== user._id));
    if (editingId === user._id) setEditingId(null);
  }

  /* ── Open edit ── */
  function openEdit(user: User) {
    setEditingId(user._id);
    setEditErrors({});
    setEditForm({ fullName: user.fullName, email: user.email, mobile: user.mobile,
      address: user.address, username: user.username, role: user.role, password: "" });
  }

  function validateEdit() {
    const e: Record<string, string> = {};
    if (!editForm.fullName.trim())             e.fullName = "Required.";
    if (!editForm.email.includes("@"))         e.email    = "Enter a valid email.";
    if (!/^\d{10}$/.test(editForm.mobile))     e.mobile   = "Must be 10 digits.";
    if (!editForm.address.trim())              e.address  = "Required.";
    if (!editForm.username.trim())             e.username = "Required.";
    if (editForm.password && editForm.password.length < 6) e.password = "Min. 6 characters.";
    return e;
  }

  /* ── Save edit ── */
  async function saveEdit(userId: string) {
    setError(""); setMessage("");
    const errs = validateEdit();
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setBusy(true); setBusyText("Saving changes…");
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const result = await res.json();
    setBusy(false);
    if (!res.ok) { setError(result.error || "Unable to update user."); return; }
    setMessage("User updated successfully.");
    setEditingId(null);
    await load();
  }

  function inp(field: keyof EditForm) {
    return {
      value: editForm[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setEditForm(prev => ({ ...prev, [field]: e.target.value })),
    };
  }

  return (
    <>
      {busy && <TruckSpinner text={busyText} />}
      <div className="app-shell">
        <aside className="sidebar">
          <Link className="brand" href="/">
            <span className="brand-mark">RW</span>
            <span><strong>RouteWatch</strong><small>warehouse control</small></span>
          </Link>
          <nav>
            <Link className="nav-link" href="/"><span className="nav-icon">⊞</span>Tracking desk</Link>
            <Link className="nav-link active" href="/users"><span className="nav-icon">⊞</span>Manage users</Link>
          </nav>
          <div className="sidebar-footer">
            <span className="status-dot" /> Super admin<br /><small>Full system access</small>
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
              <Link href="/" className="link-button">← Back</Link>
            </div>
          </header>

          {error   && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="content-grid">

            {/* ── Users table ── */}
            <section className="panel table-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">ACCOUNT DIRECTORY</span>
                  <h2>System users <span className="user-count">({users.length})</span></h2>
                </div>
              </div>

              <div className="search-bar">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, username, email or mobile…" />
                {search && <button type="button" className="clear-search" onClick={() => setSearch("")}>✕</button>}
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-icon">👤</div>
                          <h3>{search ? "No matching users" : "No users yet"}</h3>
                          <p>{search ? "Try a different search." : "Create the first user using the form."}</p>
                        </div>
                      </td></tr>
                    )}

                    {filtered.map(user => (
                      <>
                        {/* ── Normal row ── */}
                        <tr key={user._id} className={editingId === user._id ? "row-editing" : ""}>
                          <td>
                            <strong>{user.fullName || "—"}</strong>
                            <small>{user.address}</small>
                          </td>
                          <td>
                            {user.email}
                            <small>{user.mobile}</small>
                          </td>
                          <td>{user.username}</td>
                          <td>
                            <span className={`badge ${user.role === "super_admin" ? "badge-on-track" : "badge-due-soon"}`}>
                              <span />{user.role === "super_admin" ? "Super admin" : "User"}
                            </span>
                          </td>
                          <td>{user.vehicleCount}</td>
                          <td>
                            <div className="row-actions">
                              <button className="action-btn action-edit"
                                onClick={() => editingId === user._id ? setEditingId(null) : openEdit(user)}
                                title={editingId === user._id ? "Cancel edit" : "Edit user"}>
                                {editingId === user._id ? "Cancel" : "Edit"}
                              </button>
                              {session.id !== user._id && (
                                <button className="action-btn action-delete"
                                  onClick={() => void deleteUser(user)} title="Delete user">
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* ── Inline edit row ── */}
                        {editingId === user._id && (
                          <tr key={`edit-${user._id}`} className="edit-row">
                            <td colSpan={6}>
                              <div className="edit-panel">
                                <div className="edit-panel-head">
                                  <span className="eyebrow">EDITING — {user.username}</span>
                                  <button className="clear-search" onClick={() => setEditingId(null)}>✕ Close</button>
                                </div>
                                <div className="edit-grid">
                                  <label>Full name <span className="req">*</span>
                                    <input {...inp("fullName")} placeholder="Full name" />
                                    {editErrors.fullName && <span className="field-error">{editErrors.fullName}</span>}
                                  </label>
                                  <label>Email <span className="req">*</span>
                                    <input type="email" {...inp("email")} placeholder="Email" />
                                    {editErrors.email && <span className="field-error">{editErrors.email}</span>}
                                  </label>
                                  <label>Mobile <span className="req">*</span>
                                    <input {...inp("mobile")} placeholder="10-digit mobile" maxLength={10} inputMode="numeric" />
                                    {editErrors.mobile && <span className="field-error">{editErrors.mobile}</span>}
                                  </label>
                                  <label>Username <span className="req">*</span>
                                    <input {...inp("username")} placeholder="Username" />
                                    {editErrors.username && <span className="field-error">{editErrors.username}</span>}
                                  </label>
                                  <label className="edit-full">Address <span className="req">*</span>
                                    <input {...inp("address")} placeholder="Address" />
                                    {editErrors.address && <span className="field-error">{editErrors.address}</span>}
                                  </label>
                                  <label>Role
                                    <select {...inp("role")}>
                                      <option value="user">User</option>
                                      <option value="super_admin">Super admin</option>
                                    </select>
                                  </label>
                                  <label>New password <small className="muted-label">(leave blank to keep current)</small>
                                    <input type="password" {...inp("password")} placeholder="Min. 6 characters" autoComplete="new-password" />
                                    {editErrors.password && <span className="field-error">{editErrors.password}</span>}
                                  </label>
                                </div>
                                <div className="edit-actions">
                                  <button className="button button-primary edit-save-btn" onClick={() => void saveEdit(user._id)} disabled={busy}>
                                    {busy ? "Saving…" : "Save changes"} <span>→</span>
                                  </button>
                                  <button className="button button-outline" onClick={() => setEditingId(null)}>Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Create user form ── */}
            <section className="panel add-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">NEW ACCOUNT</span>
                  <h2>Create user</h2>
                </div>
              </div>
              <form onSubmit={create} className="vehicle-form" noValidate>
                <label>Full name <span className="req">*</span>
                  <input name="fullName" placeholder="e.g. Ramesh Kumar" />
                  {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
                </label>
                <label>Email address <span className="req">*</span>
                  <input type="email" name="email" placeholder="e.g. ramesh@example.com" />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </label>
                <label>Mobile number <span className="req">*</span>
                  <input name="mobile" placeholder="10-digit number" maxLength={10} inputMode="numeric" pattern="\d{10}" />
                  {fieldErrors.mobile && <span className="field-error">{fieldErrors.mobile}</span>}
                </label>
                <label>Address <span className="req">*</span>
                  <textarea name="address" rows={2} placeholder="Full address" />
                  {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
                </label>
                <label>Username <span className="req">*</span>
                  <input name="username" placeholder="e.g. ramesh_k" autoComplete="off" />
                  {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
                </label>
                <label>Password <span className="req">*</span>
                  <input type="password" name="password" placeholder="Min. 6 characters" autoComplete="new-password" />
                  {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                </label>
                <label>Role <span className="req">*</span>
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
