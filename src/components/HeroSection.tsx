import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import ProductPreview from "./ProductPreview";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.photo} aria-hidden="true" />

      <div className={styles.inner}>
        <p className={styles.kicker}>Invoicing for freelancers and small teams</p>
        <h1 className={styles.title}>
          <span>Invoices</span>
          <span>that get</span>
          <span className={styles.accent}>you paid.</span>
        </h1>
        <p className={styles.subtitle}>
          Save your clients once. Send clean, professional PDF invoices in under a minute, from your laptop or your phone.
        </p>
        <div className={styles.actions}>
          <Link href="/auth/signup" className={styles.primary}>
            Start free <ArrowRight size={18} />
          </Link>
          <a href="#try-it" className={styles.secondary}>
            Try it without an account <ArrowDown size={16} />
          </a>
        </div>
      </div>

      <div className={styles.preview}>
        <ProductPreview />
      </div>
    </section>
  );
}
