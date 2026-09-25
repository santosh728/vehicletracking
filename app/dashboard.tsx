"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SessionUser } from "../lib/auth";

type Vehicle = {
  _id: string; vehicleNumber: string; driverName: string; billNumber: string;
  origin: string; destination: string; validUntil: string; notes?: string;
};

function status(date: string) {
  const days = Math.ceil((new Date(`${date}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  if (days < 0) return ["overdue", `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`];
  if (days === 0) return ["due-today", "Due today"];
  if (days === 1) return ["due-soon", "1 day left"];
  return ["on-track", `${days} days left`];
}

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

export default function Dashboard({ session }: { session: SessionUser }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState("Please wait…");
  const formRef = useRef<HTMLFormElement>(null);

  async function load(q = query) {
    const response = await fetch(`/api/vehicles?q=${encodeURIComponent(q)}`);
    const result = await response.json();
    if (response.ok) setVehicles(result.vehicles);
    else setError(result.error || "Unable to load vehicles.");
  }

  useEffect(() => { void load(); }, []);

  // Auto-clear success message after 4 seconds
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    setBusy(true);
    setBusyText("Saving vehicle…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Unable to save vehicle.");
    } else {
      setMessage("Vehicle added successfully.");
      formRef.current?.reset();   // clear form instantly
      await load();               // refresh list without page reload
    }
  }

  async function removeVehicle(id: string) {
    if (!confirm("Remove this vehicle entry?")) return;
    setBusy(true);
    setBusyText("Removing vehicle…");
    const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      const result = await response.json();
      setError(result.error || "Unable to remove vehicle.");
      return;
    }
    setVehicles(prev => prev.filter(v => v._id !== id));
    await load();
  }

  const counts = vehicles.reduce((result, vehicle) => {
    const [kind] = status(vehicle.validUntil);
    result.total += 1;
    if (kind === "overdue") result.overdue += 1;
    else if (kind === "due-soon" || kind === "due-today") result.dueSoon += 1;
    else result.onTrack += 1;
    return result;
  }, { total: 0, overdue: 0, dueSoon: 0, onTrack: 0 });

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
            <Link className="nav-link active" href="/"><span className="nav-icon">⊞</span>Tracking desk</Link>
            {session.role === "super_admin" && (
              <Link className="nav-link" href="/users"><span className="nav-icon">⊞</span>Manage users</Link>
            )}
          </nav>
          <div className="sidebar-footer">
            <span className="status-dot" /> System online<br />
            <small>MongoDB edition</small>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <span className="eyebrow">OPERATIONS / LIVE VIEW</span>
              <h1>Vehicle tracking desk</h1>
            </div>
            <div className="user-menu">
              <span className="avatar">{session.role === "super_admin" ? "SA" : "US"}</span>
              <span className="user-details">
                <strong>{session.fullName || session.username}</strong>
                <small>{session.mobile}</small>
              </span>
              <button className="link-button" onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                location.href = "/login";
              }}>Sign out</button>
            </div>
          </header>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          {/* Metrics */}
          <section className="metric-grid">
            <article className="metric metric-dark">
              <span className="metric-label">Active vehicles</span>
              <strong>{counts.total}</strong>
              <span className="metric-foot">All logged journeys</span>
            </article>
            <article className="metric">
              <span className="metric-label">Overdue</span>
              <strong className="text-red">{counts.overdue}</strong>
              <span className="metric-foot">Needs checking now</span>
            </article>
            <article className="metric">
              <span className="metric-label">Due within 24h</span>
              <strong className="text-amber">{counts.dueSoon}</strong>
              <span className="metric-foot">Follow up soon</span>
            </article>
            <article className="metric">
              <span className="metric-label">On track</span>
              <strong className="text-green">{counts.onTrack}</strong>
              <span className="metric-foot">Within four days</span>
            </article>
          </section>

          <div className="content-grid">
            {/* Vehicle list */}
            <section className="panel table-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">JOURNEY MONITOR</span>
                  <h2>Current vehicle entries</h2>
                </div>
                <span className="live-label"><span className="status-dot" />Live</span>
              </div>
              <form className="search-bar" onSubmit={e => { e.preventDefault(); void load(); }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search vehicle, driver, bill or route"
                />
                {query && (
                  <button type="button" className="clear-search" onClick={() => { setQuery(""); void load(""); }}>✕</button>
                )}
                <button className="button button-primary" type="submit">Search</button>
              </form>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle / driver</th>
                      <th>eBay bill</th>
                      <th>Route</th>
                      <th>Valid till</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(vehicle => {
                      const [kind, label] = status(vehicle.validUntil);
                      return (
                        <tr className={`row-${kind}`} key={vehicle._id}>
                          <td>
                            <strong>{vehicle.vehicleNumber}</strong>
                            <small>{vehicle.driverName || "Driver not assigned"}</small>
                          </td>
                          <td>{vehicle.billNumber}</td>
                          <td>
                            {vehicle.origin}
                            <span className="route-arrow">→</span>
                            {vehicle.destination}
                          </td>
                          <td>{new Date(`${vehicle.validUntil}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td><span className={`badge badge-${kind}`}><span />{label}</span></td>
                          <td>
                            <button className="icon-button" onClick={() => void removeVehicle(vehicle._id)} aria-label="Remove entry" title="Remove">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {vehicles.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🚛</div>
                    <h3>No vehicles logged yet</h3>
                    <p>Add the first warehouse departure to start monitoring bill validity.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Add vehicle form */}
            <section className="panel add-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">NEW DEPARTURE</span>
                  <h2>Log a vehicle</h2>
                </div>
              </div>
              <p className="form-intro">Choose the eBay bill valid-till date. New entries are recorded from today.</p>
              <form ref={formRef} onSubmit={addVehicle} className="vehicle-form">
                <label>
                  Vehicle number <span className="req">*</span>
                  <input name="vehicleNumber" placeholder="e.g. MH12AB1234" required />
                </label>
                <label>
                  Driver name
                  <input name="driverName" placeholder="e.g. Ramesh Kumar" />
                </label>
                <label>
                  eBay bill number <span className="req">*</span>
                  <input name="billNumber" inputMode="numeric" minLength={12} maxLength={12} pattern="[0-9]{12}" placeholder="12-digit bill number" required />
                </label>
                <div className="form-row">
                  <label>From <span className="req">*</span><input name="origin" placeholder="Origin" required /></label>
                  <label>To <span className="req">*</span><input name="destination" placeholder="Destination" required /></label>
                </div>
                <label>
                  Valid till <span className="req">*</span>
                  <input type="date" name="validUntil" required />
                </label>
                <label>
                  Notes
                  <textarea name="notes" rows={2} placeholder="Optional notes…" />
                </label>
                <button className="button button-primary" type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Add vehicle"} <span>→</span>
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
