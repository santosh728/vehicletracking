import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "../../../lib/mongodb";
import { requireSuperAdmin } from "../../../lib/auth";
import { isUsername } from "../../../lib/validation";

export async function GET() {
  try {
    await requireSuperAdmin();
    const db = await getDb();
    const users = await db.collection("users").find({}, { projection: { passwordHash: 0 } }).sort({ role: -1, username: 1 }).toArray();
    const vehicleCounts = await db.collection("vehicles").aggregate([{ $group: { _id: "$ownerId", count: { $sum: 1 } } }]).toArray();
    const counts = new Map(vehicleCounts.map(item => [String(item._id), item.count]));
    return NextResponse.json({ users: users.map(user => ({ ...user, _id: String(user._id), vehicleCount: counts.get(String(user._id)) || 0 })) });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "Super admin permission is required." : "Please sign in." }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim();
    const mobile = String(body.mobile || "").trim();
    const address = String(body.address || "").trim();
    const role = body.role === "super_admin" ? "super_admin" : "user";
    if (!fullName || !isUsername(username) || password.length < 6 || !email.includes("@") || !mobile || !address) {
      return NextResponse.json({ error: "Complete all fields; password must be at least 6 characters." }, { status: 400 });
    }
    const db = await getDb();
    const existing = await db.collection("users").findOne({ $or: [{ username }, { email }] });
    if (existing) {
      const field = existing.username === username ? "username" : "email address";
      return NextResponse.json({ error: `That ${field} is already taken. Please choose a different one.` }, { status: 409 });
    }
    await db.collection("users").insertOne({ fullName, email, mobile, address, username, passwordHash: await bcrypt.hash(password, 12), role, createdAt: new Date() });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Super admin permission is required." }, { status: 403 });
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({ error: "Unable to create user. Please try again." }, { status: 500 });
  }
}
