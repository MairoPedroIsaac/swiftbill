'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDown, Check } from 'lucide-react';
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
        <h1 className={styles.title}>
          Create professional invoices <span className={styles.highlight}>in seconds.</span>
        </h1>
        <p className={styles.subtitle}>
          Save your clients and items once, then turn out clean PDF invoices whenever you need them.
          Everything stays in your account, so nothing gets lost.
        </p>
        <div className={styles.actions}>
          <button className={styles.ctaButton} onClick={scrollToGenerator}>
            Create an invoice <ArrowDown size={18} />
          </button>
          <Link href="/auth/signup" className={styles.secondaryButton}>
            Create a free account
          </Link>
        </div>
        <ul className={styles.points}>
          <li><Check size={16} /> No card needed</li>
          <li><Check size={16} /> Three PDF templates</li>
          <li><Check size={16} /> Works on your phone</li>
        </ul>
      </div>
    </section>
  );
}
