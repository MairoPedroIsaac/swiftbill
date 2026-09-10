import styles from "./Auth.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        {children}
      </div>
    </div>
  );
}
