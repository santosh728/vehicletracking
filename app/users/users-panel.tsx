"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { SessionUser } from "../../lib/auth";

type User = { _id: string; fullName: string; email: string; mobile: string; address: string; username: string; role: string; vehicleCount: number };

export default function UsersPanel({ session }: { session: SessionUser }) {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/users");
    const result = await response.json();
    if (response.ok) setUsers(result.users);
    else setError(result.error || "Unable to load users.");
  }
  useEffect(() => { void load(); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Unable to create user.");
    else { setMessage("User created successfully."); event.currentTarget.reset(); await load(); }
  }

  return <div className="app-shell"><aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark">RW</span><span><strong>RouteWatch</strong><small>warehouse control</small></span></Link><nav><Link className="nav-link" href="/"><span className="nav-icon">+</span>Tracking desk</Link><Link className="nav-link active" href="/users"><span className="nav-icon">+</span>Manage users</Link></nav><div className="sidebar-footer"><span className="status-dot" /> Super admin<br /><small>Full system access</small></div></aside><main className="main-content"><header className="topbar"><div><span className="eyebrow">ADMINISTRATION / ACCESS</span><h1>Manage users</h1></div><div className="user-menu"><span className="avatar">SA</span><span className="user-details"><strong>{session.fullName || session.username}</strong><small>{session.mobile}</small></span><Link href="/">Back</Link></div></header>{(error || message) && <div className={`alert ${error ? "alert-error" : "alert-success"}`}>{error || message}</div>}<div className="content-grid"><section className="panel table-panel"><div className="panel-heading"><div><span className="eyebrow">ACCOUNT DIRECTORY</span><h2>System users</h2></div></div><div className="table-wrap"><table><thead><tr><th>Full name</th><th>Contact</th><th>Username</th><th>Role</th><th>Vehicles</th></tr></thead><tbody>{users.map(user => <tr key={user._id}><td><strong>{user.fullName || "Profile incomplete"}</strong><small>{user.address}</small></td><td>{user.email}<small>{user.mobile}</small></td><td>{user.username}</td><td>{user.role === "super_admin" ? "Super admin" : "User"}</td><td>{user.vehicleCount}</td></tr>)}</tbody></table></div></section><section className="panel add-panel"><div className="panel-heading"><div><span className="eyebrow">NEW ACCOUNT</span><h2>Create user</h2></div></div><form onSubmit={create} className="vehicle-form"><label>Full name *<input name="fullName" required /></label><label>Email *<input type="email" name="email" required /></label><label>Mobile number *<input name="mobile" required /></label><label>Address *<textarea name="address" rows={2} required /></label><label>Username *<input name="username" required /></label><label>Password *<input type="password" name="password" minLength={6} required /></label><label>Role *<select name="role" defaultValue="user"><option value="user">User</option><option value="super_admin">Super admin</option></select></label><button className="button button-primary" type="submit">Create account <span>-&gt;</span></button></form></section></div></main></div>;
}
