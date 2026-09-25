import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, findUserByUsername } from "../../../../lib/auth";

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) {
    // If secret not configured, skip check (dev mode)
    console.warn("RECAPTCHA_SECRET not set — skipping captcha verification.");
    return true;
  }
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password, captchaToken } = body;

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  // Verify reCAPTCHA
  const captchaOk = await verifyCaptcha(String(captchaToken || ""));
  if (!captchaOk) {
    return NextResponse.json({ error: "reCAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  const user = await findUserByUsername(username.trim());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Username or password is incorrect." }, { status: 401 });
  }

  await createSession({
    id: String(user._id),
    username: user.username,
    fullName: user.fullName || "",
    mobile: user.mobile || "",
    role: user.role === "super_admin" ? "super_admin" : "user",
  });

  return NextResponse.json({ ok: true });
}
