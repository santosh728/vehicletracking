"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { SessionUser } from "../lib/auth";

type Vehicle = {
  _id: string; vehicleNumber: string; driverName: string; billNumber: string;
  origin: string; destination: string; validUntil: string;
};

function status(date: string) {
  const days = Math.ceil((new Date(`${date}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  if (days < 0) return ["overdue", `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`];
  if (days === 0) return ["due-today", "Due today"];
  if (days === 1) return ["due-soon", "1 day left"];
  return ["on-track", `${days} days left`];
}

export default function Dashboard({ session }: { session: SessionUser }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch(`/api/vehicles?q=${encodeURIComponent(query)}`);
    const result = await response.json();
    if (response.ok) setVehicles(result.vehicles);
    else setError(result.error || "Unable to load vehicles.");
  }

  useEffect(() => { void load(); }, []);

  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Unable to save vehicle.");
    else { setMessage("Vehicle added."); event.currentTarget.reset(); await load(); }
  }

  async function removeVehicle(id: string) {
    if (!confirm("Remove this vehicle entry?")) return;
    const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    if (!response.ok) { const result = await response.json(); setError(result.error || "Unable to remove vehicle."); return; }
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

  return <div className="app-shell">
    <aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark">RW</span><span><strong>RouteWatch</strong><small>warehouse control</small></span></Link>
      <nav><Link className="nav-link active" href="/"><span className="nav-icon">+</span>Tracking desk</Link>{session.role === "super_admin" && <Link className="nav-link" href="/users"><span className="nav-icon">+</span>Manage users</Link>}</nav>
      <div className="sidebar-footer"><span className="status-dot" /> System online<br /><small>MongoDB edition</small></div>
    </aside>
    <main className="main-content"><header className="topbar"><div><span className="eyebrow">OPERATIONS / LIVE VIEW</span><h1>Vehicle tracking desk</h1></div><div className="user-menu"><span className="avatar">{session.role === "super_admin" ? "SA" : "US"}</span><span className="user-details"><strong>{session.fullName || session.username}</strong><small>{session.mobile}</small></span><button className="link-button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>Sign out</button></div></header>
      {(error || message) && <div className={`alert ${error ? "alert-error" : "alert-success"}`}>{error || message}</div>}
      <section className="metric-grid"><article className="metric metric-dark"><span className="metric-label">Active vehicles</span><strong>{counts.total}</strong><span className="metric-foot">All logged journeys</span></article><article className="metric"><span className="metric-label">Overdue</span><strong className="text-red">{counts.overdue}</strong><span className="metric-foot">Needs checking now</span></article><article className="metric"><span className="metric-label">Due within 24h</span><strong className="text-amber">{counts.dueSoon}</strong><span className="metric-foot">Follow up soon</span></article><article className="metric"><span className="metric-label">On track</span><strong className="text-green">{counts.onTrack}</strong><span className="metric-foot">Within four days</span></article></section>
      <div className="content-grid"><section className="panel table-panel"><div className="panel-heading"><div><span className="eyebrow">JOURNEY MONITOR</span><h2>Current vehicle entries</h2></div><span className="live-label"><span className="status-dot" />Live</span></div><form className="search-bar" onSubmit={event => { event.preventDefault(); void load(); }}><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search vehicle, driver, bill or route" /><button className="button button-primary" type="submit">Search</button></form><div className="table-wrap"><table><thead><tr><th>Vehicle / driver</th><th>eBay bill</th><th>Route</th><th>Valid till</th><th>Status</th><th /></tr></thead><tbody>{vehicles.map(vehicle => { const [kind, label] = status(vehicle.validUntil); return <tr className={`row-${kind}`} key={vehicle._id}><td><strong>{vehicle.vehicleNumber}</strong><small>{vehicle.driverName || "Driver not assigned"}</small></td><td>{vehicle.billNumber}</td><td>{vehicle.origin}<span className="route-arrow">-&gt;</span>{vehicle.destination}</td><td>{new Date(`${vehicle.validUntil}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td><span className={`badge badge-${kind}`}><span />{label}</span></td><td><button className="icon-button" onClick={() => void removeVehicle(vehicle._id)} aria-label="Remove entry">x</button></td></tr>; })}</tbody></table>{vehicles.length === 0 && <div className="empty-state"><div className="empty-icon">+</div><h3>No vehicles logged yet</h3><p>Add the first warehouse departure to start monitoring bill validity.</p></div>}</div></section>
        <section className="panel add-panel"><div className="panel-heading"><div><span className="eyebrow">NEW DEPARTURE</span><h2>Log a vehicle</h2></div></div><p className="form-intro">Choose the eBay bill valid-till date. New entries are recorded from today.</p><form onSubmit={addVehicle} className="vehicle-form"><label>Vehicle number *<input name="vehicleNumber" required /></label><label>Driver name<input name="driverName" /></label><label>eBay bill number *<input name="billNumber" inputMode="numeric" minLength={12} maxLength={12} pattern="[0-9]{12}" required /></label><div className="form-row"><label>From *<input name="origin" required /></label><label>To *<input name="destination" required /></label></div><label>Valid till *<input type="date" name="validUntil" required /></label><label>Notes<textarea name="notes" rows={3} /></label><button className="button button-primary" type="submit">Add vehicle <span>-&gt;</span></button></form></section></div>
    </main>
  </div>;
}
