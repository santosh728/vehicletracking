import { NextResponse } from "next/server";
import { getDb, } from "../../../lib/mongodb";
import { requireSession } from "../../../lib/auth";
import { isBillNumber, isValidDate } from "../../../lib/validation";

function dateToday() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const query = new URL(request.url).searchParams.get("q")?.trim() || "";
    const filter: Record<string, unknown> = session.role === "super_admin" ? {} : { ownerId: session.id };
    if (query) {
      filter.$or = ["vehicleNumber", "driverName", "billNumber", "origin", "destination"]
        .map(field => ({ [field]: { $regex: query, $options: "i" } }));
    }
    const vehicles = await (await getDb()).collection("vehicles").find(filter).sort({ validUntil: 1, departedFrom: -1 }).toArray();
    return NextResponse.json({ vehicles: vehicles.map(vehicle => ({ ...vehicle, _id: String(vehicle._id) })) });
  } catch (error) {
    const message = error instanceof Error && error.message === "UNAUTHORIZED" ? "Please sign in." : "Unable to load vehicles.";
    return NextResponse.json({ error: message }, { status: message === "Please sign in." ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const vehicleNumber = String(body.vehicleNumber || "").trim();
    const driverName = String(body.driverName || "").trim();
    const billNumber = String(body.billNumber || "").trim();
    const origin = String(body.origin || "").trim();
    const destination = String(body.destination || "").trim();
    const validUntil = String(body.validUntil || "");
    const notes = String(body.notes || "").trim();
    if (!vehicleNumber || !billNumber || !origin || !destination || !isBillNumber(billNumber)) {
      return NextResponse.json({ error: "Complete all required fields; the bill number must contain exactly 12 digits." }, { status: 400 });
    }
    if (!isValidDate(validUntil) || validUntil < dateToday()) {
      return NextResponse.json({ error: "The valid-till date cannot be before today." }, { status: 400 });
    }
    await (await getDb()).collection("vehicles").insertOne({
      vehicleNumber, driverName, billNumber, origin, destination,
      departedFrom: dateToday(), validUntil, notes, ownerId: session.id,
      createdAt: new Date()
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "Please sign in." : "Unable to save vehicle." }, { status });
  }
}
