"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

// Opened by the SwiftBill mobile app for "Continue with Google".
// It starts the normal Google sign in, then /api/mobile/callback
// sends a token back to the app.
export default function MobileAuthPage() {
  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get("redirect") || "";
    if (!redirect.startsWith("swiftbillmobile://") && !redirect.startsWith("exp://")) return;
    signIn("google", {
      callbackUrl: `/api/mobile/callback?redirect=${encodeURIComponent(redirect)}`,
    });
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#070d1a",
        color: "#fff",
        fontFamily: "inherit",
      }}
    >
      <p style={{ opacity: 0.8 }}>Opening Google sign in...</p>
    </main>
  );
}
