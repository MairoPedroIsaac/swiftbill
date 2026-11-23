"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import styles from "../Auth.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
    setEmail(params.get("email") || "");
    setReady(true);
  }, []);

  const linkMissing = ready && (!token || !email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }
      router.push("/auth/signin?reset=1");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setIsLoading(false);
    }
  };

  const eyeStyle: React.CSSProperties = {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0,
  };

  return (
    <>
      <div className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>S</div>
          <span className={styles.logoBrand}>SwiftBill</span>
        </Link>
        <h1 className={styles.title}>Set a new password</h1>
        <p className={styles.subtitle}>{email ? `For ${email}` : "Choose a password you haven't used here before."}</p>
      </div>

      {linkMissing ? (
        <div className={styles.error} role="alert">
          This link is incomplete. Open the link from your email again, or{" "}
          <Link href="/auth/forgot-password" className={styles.link}>ask for a new one</Link>.
        </div>
      ) : (
        <>
          {error && (
            <div className={styles.error} role="alert">
              {error}{" "}
              {error.includes("expired") && (
                <Link href="/auth/forgot-password" className={styles.link}>Get a new link</Link>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="pw">New password</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="pw"
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="At least 8 characters"
                  style={{ paddingRight: 40 }}
                  autoComplete="new-password"
                  autoFocus
                />
                <button type="button" onClick={() => setShow(!show)} style={eyeStyle} aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="pw2">Confirm new password</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="pw2"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={styles.input}
                  placeholder="Type it again"
                  style={{ paddingRight: 40 }}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeStyle} aria-label={showConfirm ? "Hide password" : "Show password"}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading || !ready} className={styles.btnSubmit}>
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Save new password
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </>
      )}

      <div className={styles.footer}>
        Remembered it?{" "}
        <Link href="/auth/signin" className={styles.link}>Sign in</Link>
      </div>
    
    </>
  );
}
