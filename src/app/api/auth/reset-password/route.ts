import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken, resetIdentifier } from "@/lib/passwordReset";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

const BAD_LINK = "This reset link is invalid or has expired. Please ask for a new one.";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const pw = parsed.error.issues.find((i) => i.path[0] === "password");
    return NextResponse.json({ error: pw ? pw.message : BAD_LINK }, { status: 400 });
  }
  const { email, token, password } = parsed.data;
  const identifier = resetIdentifier(email);

  try {
    const record = await prisma.verificationToken.findUnique({ where: { token: hashToken(token) } });
    if (!record || record.identifier !== identifier || record.expires < new Date()) {
      return NextResponse.json({ error: BAD_LINK }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: BAD_LINK }, { status: 400 });

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 10) } }),
      // The link works once
      prisma.verificationToken.deleteMany({ where: { identifier } }),
      // Sign out other devices
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ message: "Password updated. You can sign in now." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
