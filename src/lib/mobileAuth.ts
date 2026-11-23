import { headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { encode, decode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

// Sign-in tokens for the SwiftBill mobile app.
// The app cannot use the website's cookies, so it sends
// "Authorization: Bearer <token>" instead. Tokens are encrypted
// with NEXTAUTH_SECRET, the same secret as the website's sessions.

const MOBILE_TOKEN_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export async function createMobileToken(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  return encode({
    token: { sub: user.id, email: user.email, name: user.name ?? null, mobile: true },
    secret: process.env.NEXTAUTH_SECRET as string,
    maxAge: MOBILE_TOKEN_MAX_AGE,
  });
}

// Use in API routes instead of getServerSession(authOptions).
// Works for the website (cookie) and the mobile app (Bearer token).
export async function getApiSession(): Promise<{ user: { email: string } } | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) return { user: { email: session.user.email } };

  const auth = (await headers()).get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;

  try {
    const token = await decode({
      token: auth.slice(7).trim(),
      secret: process.env.NEXTAUTH_SECRET as string,
    });
    if (token?.mobile && typeof token.email === "string") {
      return { user: { email: token.email } };
    }
  } catch {
    // bad or expired token
  }
  return null;
}

// Only send tokens back to the SwiftBill app.
// exp:// is Expo Go during development. Remove it before the store release.
export function isAllowedAppRedirect(url: string | null): url is string {
  if (!url) return false;
  return url.startsWith("swiftbillmobile://") || url.startsWith("exp://");
}
