import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { requireSession } from "../../../../lib/auth";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: "Invalid vehicle id." }, { status: 400 });
    const filter = session.role === "super_admin" ? { _id: new ObjectId(params.id) } : { _id: new ObjectId(params.id), ownerId: session.id };
    const result = await (await getDb()).collection("vehicles").deleteOne(filter);
    if (!result.deletedCount) return NextResponse.json({ error: "Vehicle not found or access denied." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "Please sign in." : "Unable to remove vehicle." }, { status });
  }
}
