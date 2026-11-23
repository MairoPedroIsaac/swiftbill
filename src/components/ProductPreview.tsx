import { Check, FileText, CheckCircle2, Clock, Download } from "lucide-react";
import styles from "./ProductPreview.module.css";

const ROWS = [
  { no: "INV-031", client: "Kigali Coffee Co.", amount: "$1,800.00", status: "Paid" },
  { no: "INV-030", client: "Umubano Studio", amount: "$640.00", status: "Sent" },
  { no: "INV-029", client: "Akagera Tours", amount: "$2,150.00", status: "Paid" },
  { no: "INV-028", client: "Nyamirambo Prints", amount: "$320.00", status: "Draft" },
];

// A drawn, not screenshotted, preview of the dashboard and a PDF invoice.
// It stays sharp on every screen and never goes out of date with a stale image.
export default function ProductPreview() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.window}>
        <div className={styles.chrome}>
          <span /><span /><span />
          <div className={styles.url}>swiftbill-swart.vercel.app/dashboard</div>
        </div>
        <div className={styles.app}>
          <aside className={styles.side}>
            <div className={styles.sideBrand}><b>S</b>SwiftBill</div>
            <div className={`${styles.sideItem} ${styles.sideActive}`}>Overview</div>
            <div className={styles.sideItem}>All invoices</div>
            <div className={styles.sideItem}>Settings</div>
            <div className={styles.sideBtn}>+ New invoice</div>
          </aside>
          <div className={styles.main}>
            <div className={styles.hello}>Welcome back, Aline</div>
            <div className={styles.stats}>
              <div className={styles.stat}><FileText size={14} /><strong>31</strong><small>Invoices</small></div>
              <div className={styles.stat}><CheckCircle2 size={14} /><strong>$12.4k</strong><small>Paid</small></div>
              <div className={styles.stat}><Clock size={14} /><strong>3</strong><small>Drafts</small></div>
            </div>
            <div className={styles.table}>
              {ROWS.map((r) => (
                <div key={r.no} className={styles.row}>
                  <span className={styles.no}>{r.no}</span>
                  <span className={styles.client}>{r.client}</span>
                  <span className={`${styles.pill} ${styles[r.status.toLowerCase()]}`}>{r.status}</span>
                  <span className={styles.amt}>{r.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.paper}>
        <div className={styles.paperTop}>
          <div>
            <div className={styles.paperLabel}>INVOICE</div>
            <div className={styles.paperNo}>INV-031</div>
          </div>
          <div className={styles.paid}><Check size={12} /> Paid</div>
        </div>
        <div className={styles.paperTo}>Billed to<b>Kigali Coffee Co.</b></div>
        <div className={styles.paperLine}><span>Website design</span><span>$1,200</span></div>
        <div className={styles.paperLine}><span>Hosting, 12 months</span><span>$240</span></div>
        <div className={styles.paperLine}><span>Logo refresh</span><span>$360</span></div>
        <div className={styles.paperTotal}><span>Total</span><b>$1,800.00</b></div>
        <div className={styles.paperBtn}><Download size={13} /> Download PDF</div>
      </div>
    </div>
  );
}
