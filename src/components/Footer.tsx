import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoIcon}>S</span>
          SwiftBill
        </Link>
        <nav className={styles.links} aria-label="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
        <p className={styles.copy}>© {year} SwiftBill</p>
      </div>
    </footer>
  );
}
