import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { requireSuperAdmin } from "../../../../lib/auth";

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = params;

    // Prevent deleting yourself
    if (session.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN")
      return NextResponse.json({ error: "Super admin permission is required." }, { status: 403 });
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({ error: "Unable to delete user." }, { status: 500 });
  }
}
