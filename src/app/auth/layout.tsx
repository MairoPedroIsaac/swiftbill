import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import styles from "./Auth.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.split}>
      <aside className={styles.brandPanel}>
        <Link href="/" className={styles.panelLogo}>
          <span className={styles.panelLogoIcon}>S</span>
          SwiftBill
        </Link>

        <div className={styles.panelBody}>
          <h2 className={styles.panelTitle}>
            Get paid<br />
            <span>for your work.</span>
          </h2>
          <p className={styles.panelText}>
            Clean PDF invoices in under a minute. Your clients, items and history, saved in one place.
          </p>

          <div className={styles.panelCard} aria-hidden="true">
            <div className={styles.panelCardTop}>
              <div>
                <small>INVOICE</small>
                <strong>INV-031</strong>
              </div>
              <span className={styles.paidChip}>
                <CheckCircle2 size={13} /> Paid
              </span>
            </div>
            <div className={styles.panelCardRow}>
              <span>Kigali Coffee Co.</span>
              <strong className="tabular">$1,800.00</strong>
            </div>
          </div>
        </div>

        <p className={styles.panelFoot}>Free to start. No card needed.</p>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.formInner}>{children}</div>
      </main>
    </div>
  );
}
