import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, findUserByUsername } from "../../../../lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }
  const user = await findUserByUsername(username.trim());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Username or password is incorrect." }, { status: 401 });
  }
  await createSession({
    id: String(user._id), username: user.username, fullName: user.fullName || "",
    mobile: user.mobile || "", role: user.role === "super_admin" ? "super_admin" : "user"
  });
  return NextResponse.json({ ok: true });
}
