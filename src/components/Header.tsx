"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Header.module.css";

// The session is checked in the browser so the homepage can be served as a
// static page. That keeps it fast and makes sure link previews (WhatsApp,
// LinkedIn, X) always find the og:image tags in the page <head>.
export default function Header() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (!cancelled && session?.user) setSignedIn(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logoText}>
          <div className={styles.logoIcon}>S</div>
          SwiftBill
        </Link>
      </div>

      <nav className={styles.nav}>
        {signedIn ? (
          <Link href="/dashboard" className={styles.btnPrimary}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/auth/signin" className={styles.linkSignIn}>
              Sign In
            </Link>
            <Link href="/auth/signup" className={styles.btnPrimary}>
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
