'use client';

import React from 'react';
import { ArrowDown } from 'lucide-react';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const scrollToGenerator = () => {
    const element = document.getElementById('invoice-generator-tool');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={`glass-panel ${styles.content}`}>
          <h1 className={styles.title}>
            Create Professional Invoices <br />
            <span className={styles.highlight}>In Seconds.</span>
          </h1>
          <p className={styles.subtitle}>
            No account required. Your data never leaves your device. Generate clean, accurate PDFs instantly.
          </p>
          <button className={styles.ctaButton} onClick={scrollToGenerator}>
            Create Invoice <ArrowDown size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
