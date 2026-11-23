"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import styles from "../Auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSentTo(email.trim());
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>S</div>
          <span className={styles.logoBrand}>SwiftBill</span>
        </Link>
        <h1 className={styles.title}>Forgot your password?</h1>
        <p className={styles.subtitle}>
          Enter the email you signed up with and we&apos;ll send you a link to set a new one.
        </p>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      {sentTo ? (
        <div className={styles.success} role="status">
          If <strong>{sentTo}</strong> has a SwiftBill account, a reset link is on its way. It works for
          1 hour. Check your spam folder if you don&apos;t see it in a few minutes.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={styles.btnSubmit}>
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Send reset link
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}

      <div className={styles.footer}>
        <Link href="/auth/signin" className={styles.link} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </div>
    </>
  );
}
