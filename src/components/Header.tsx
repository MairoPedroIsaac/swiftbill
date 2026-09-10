import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from "./Header.module.css";

export default async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logoText}>
          <div className={styles.logoIcon}>
            S
          </div>
          SwiftBill
        </Link>
      </div>

      <nav className={styles.nav}>
        {session ? (
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
