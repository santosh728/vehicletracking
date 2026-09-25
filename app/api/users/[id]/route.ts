import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "../../../../lib/mongodb";
import { requireSuperAdmin } from "../../../../lib/auth";
import { isUsername, isMobile } from "../../../../lib/validation";

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = params;

    if (session.id === id)
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });

    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });

    const db = await getDb();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN")
      return NextResponse.json({ error: "Super admin permission is required." }, { status: 403 });
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({ error: "Unable to delete user." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();
    const { id } = params;

    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });

    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email    = String(body.email    || "").trim();
    const mobile   = String(body.mobile   || "").trim();
    const address  = String(body.address  || "").trim();
    const username = String(body.username || "").trim();
    const role     = body.role === "super_admin" ? "super_admin" : "user";
    const password = String(body.password || "");

    if (!fullName || !email.includes("@") || !isMobile(mobile) || !address || !isUsername(username))
      return NextResponse.json({ error: "Complete all fields. Mobile must be 10 digits." }, { status: 400 });

    const db = await getDb();

    // Check duplicate username/email on another user
    const conflict = await db.collection("users").findOne({
      _id: { $ne: new ObjectId(id) },
      $or: [{ username }, { email }],
    });
    if (conflict) {
      const field = conflict.username === username ? "username" : "email address";
      return NextResponse.json({ error: `That ${field} is already taken.` }, { status: 409 });
    }

    const update: Record<string, unknown> = { fullName, email, mobile, address, username, role, updatedAt: new Date() };
    if (password.length >= 6) {
      update.passwordHash = await bcrypt.hash(password, 12);
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN")
      return NextResponse.json({ error: "Super admin permission is required." }, { status: 403 });
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({ error: "Unable to update user." }, { status: 500 });
  }
}
