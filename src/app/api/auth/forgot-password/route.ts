import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { RESET_TTL_MS, hashToken, newToken, resetIdentifier } from "@/lib/passwordReset";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

// Same answer whether or not the account exists, so nobody can test which emails are registered.
const OK = { message: "If an account exists for that email, we've sent a reset link." };

function baseUrl(req: NextRequest) {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, "") || req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const email = parsed.data.email;

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { email: true, password: true },
    });
    if (!user?.email) return NextResponse.json(OK);

    const identifier = resetIdentifier(email);

    // At most one email a minute per address.
    const recent = await prisma.verificationToken.findFirst({
      where: { identifier, expires: { gt: new Date(Date.now() + RESET_TTL_MS - 60_000) } },
    });
    if (recent) return NextResponse.json(OK);

    if (!user.password) {
      // Signed up with Google: there is no password to reset.
      await sendMail({
        to: user.email,
        subject: "Signing in to SwiftBill",
        text: `Someone asked to reset the SwiftBill password for this email.\n\nYour account uses Google sign-in, so there is no password to reset. Go to ${baseUrl(req)}/auth/signin and choose "Continue with Google".\n\nIf this wasn't you, you can ignore this email.`,
        html: emailHtml(
          "Your account uses Google",
          `Someone asked to reset the SwiftBill password for this email. Your account signs in with Google, so there is no password to reset.`,
          `${baseUrl(req)}/auth/signin`,
          "Sign in with Google"
        ),
      });
      return NextResponse.json(OK);
    }

    const token = newToken();
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: { identifier, token: hashToken(token), expires: new Date(Date.now() + RESET_TTL_MS) },
    });

    const link = `${baseUrl(req)}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendMail({
      to: user.email,
      subject: "Reset your SwiftBill password",
      text: `Someone asked to reset the password for your SwiftBill account.\n\nSet a new password here (the link works for 1 hour):\n${link}\n\nIf this wasn't you, you can ignore this email. Your password won't change.`,
      html: emailHtml(
        "Reset your password",
        "Someone asked to reset the password for your SwiftBill account. The button below works for 1 hour. If this wasn't you, ignore this email and your password won't change.",
        link,
        "Set a new password"
      ),
    });
    return NextResponse.json(OK);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "We couldn't send the email right now. Please try again shortly." }, { status: 500 });
  }
}

function emailHtml(title: string, body: string, url: string, cta: string) {
  // Navy header band so the white SwiftBill logo (white tile, blue S) matches the website.
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${title}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#070d1a;padding:22px 32px"><table cellpadding="0" cellspacing="0"><tr>
<td style="background:#ffffff;border-radius:8px;width:30px;height:30px;line-height:30px;text-align:center;font-size:17px;font-weight:800;color:#2563eb">S</td>
<td style="padding-left:10px;font-size:19px;font-weight:700;color:#ffffff">SwiftBill</td>
</tr></table></td></tr>
<tr><td style="padding:32px 32px 0;font-size:22px;font-weight:700">${title}</td></tr>
<tr><td style="padding:12px 32px 24px;font-size:15px;line-height:1.6;color:#475569">${body}</td></tr>
<tr><td style="padding:0 32px"><a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">${cta}</a></td></tr>
<tr><td style="padding:24px 32px 32px;font-size:12px;color:#94a3b8;word-break:break-all">Or paste this link into your browser:<br>${url}</td></tr>
</table></td></tr></table></body></html>`;
}
