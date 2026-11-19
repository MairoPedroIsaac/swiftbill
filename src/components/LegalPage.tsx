import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "./Footer";
import styles from "./LegalPage.module.css";

export default function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className={styles.topBar}>
        <div className={styles.topInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoIcon}>S</span>
            SwiftBill
          </Link>
          <Link href="/" className={styles.back}>
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </header>
      <main className={styles.page}>
        <article className={styles.article}>
          <p className={styles.updated}>Last updated {updated}</p>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.intro}>{intro}</div>
          <div className={styles.body}>{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
