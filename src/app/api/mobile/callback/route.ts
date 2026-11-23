import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMobileToken, isAllowedAppRedirect } from "@/lib/mobileAuth";

// Last step of Google sign in for the mobile app.
// The user has just signed in on the website in the in-app browser.
// We hand a token back to the app through its own link.
export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get("redirect");
  if (!isAllowedAppRedirect(redirect)) {
    return NextResponse.json({ error: "Invalid redirect" }, { status: 400 });
  }

  const back = new URL(redirect);
  const session = await getServerSession(authOptions);
  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;

  if (!user?.email) {
    back.searchParams.set("error", "signin");
    return NextResponse.redirect(back);
  }

  const token = await createMobileToken({ id: user.id, email: user.email, name: user.name });
  back.searchParams.set("token", token);
  return NextResponse.redirect(back);
}
