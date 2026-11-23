import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createMobileToken } from "@/lib/mobileAuth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Email and password sign in for the mobile app.
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }
    if (!user.password) {
      return NextResponse.json(
        { error: "This account uses Google. Tap Continue with Google." },
        { status: 401 }
      );
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    const token = await createMobileToken({ id: user.id, email: user.email, name: user.name });
    return NextResponse.json({
      token,
      user: { name: user.name, email: user.email, image: user.image },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
