import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMobileToken, isAllowedAppRedirect } from "@/lib/mobileAuth";

// Last step of Google sign in for the mobile app.
// The user has just signed in on the website in the in-app browser.
// We hand a token back to the app through its own link.
// Some phone browsers block an automatic jump into an app, so the page
// also shows a button the user can tap.
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

  if (user?.email) {
    const token = await createMobileToken({ id: user.id, email: user.email, name: user.name });
    back.searchParams.set("token", token);
  } else {
    back.searchParams.set("error", "signin");
  }

  const href = back.toString();
  const safe = href.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Back to SwiftBill</title>
<style>
  body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#070d1a;color:#fff;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
  .tile{width:56px;height:56px;border-radius:15px;background:#fff;color:#3b82f6;font-weight:900;
    font-size:32px;display:grid;place-items:center;margin:0 auto 20px}
  h1{font-size:24px;margin:0 0 8px}
  p{color:#94a3b8;margin:0 0 28px}
  a{display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;font-weight:800;
    padding:16px 28px;border-radius:14px;font-size:17px}
</style></head>
<body><main>
  <div class="tile">S</div>
  <h1>${user?.email ? "You are signed in" : "Sign in did not finish"}</h1>
  <p>${user?.email ? "Going back to the SwiftBill app." : "Go back to the app and try again."}</p>
  <a href="${safe}">Open SwiftBill app</a>
</main>
<script>setTimeout(function(){location.href=${JSON.stringify(href).replace(/</g, "\\u003c")}},300)</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
