import Link from "next/link";
import { ArrowRight, Users, FileText, Send, Palette, Smartphone, ShieldCheck } from "lucide-react";
import CountUp from "./CountUp";
import styles from "./LandingSections.module.css";

export function ProofStrip() {
  const items = [
    { to: 60, suffix: "s", label: "to send an invoice" },
    { to: 3, label: "PDF templates" },
    { to: 12, label: "currencies, RWF included" },
    // Counts down to zero: the price of getting started
    { to: 0, from: 25, prefix: "$", label: "to get started" },
  ];
  return (
    <section className={styles.proof}>
      <div className={styles.proofInner}>
        {items.map((i) => (
          <div key={i.label} className={styles.proofItem}>
            <strong>
              <CountUp to={i.to} from={i.from} prefix={i.prefix} suffix={i.suffix} />
            </strong>
            <span>{i.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "01", icon: Users, title: "Add your client", text: "Save their name and address once. Next time, pick them from a list." },
    { n: "02", icon: FileText, title: "List the work", text: "Add items and rates. Totals, tax and numbering are handled for you." },
    { n: "03", icon: Send, title: "Send the PDF", text: "Download a clean invoice and share it on email or WhatsApp. Mark it paid when the money lands." },
  ];
  return (
    <section className={styles.steps}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          Three steps.<br />
          <span>No spreadsheets.</span>
        </h2>
        <div className={styles.stepGrid}>
          {steps.map(({ n, icon: Icon, title, text }) => (
            <article key={n} className={styles.step}>
              <div className={styles.stepTop}>
                <span className={styles.stepNo}>{n}</span>
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.featureGrid}>
          <article className={`${styles.feature} ${styles.featureBig}`}>
            <Palette size={26} />
            <h3>Look like a real business from day one.</h3>
            <p>Pick Minimal, Modern or Classic. Your business name, your address, your own invoice numbering, on every invoice.</p>
            <div className={styles.templates} aria-hidden="true">
              <div className={styles.tpl}><i /><b /><b /><b /></div>
              <div className={`${styles.tpl} ${styles.tplModern}`}><i /><b /><b /><b /></div>
              <div className={`${styles.tpl} ${styles.tplClassic}`}><i /><b /><b /><b /></div>
            </div>
          </article>
          <article className={styles.feature}>
            <Smartphone size={26} />
            <h3>Works great on your phone.</h3>
            <p>Create, check and update invoices on the go. Every screen works on mobile.</p>
          </article>
          <article className={styles.feature}>
            <ShieldCheck size={26} />
            <h3>Nothing gets lost.</h3>
            <p>Invoices are saved to your account, and drafts save as you type.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaInner}>
        <h2>
          Stop chasing paperwork.<br />
          Start getting paid.
        </h2>
        <Link href="/auth/signup" className={styles.ctaBtn}>
          Create your free account <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

export function TryItIntro() {
  return (
    <div className={styles.tryIntro} id="try-it">
      <h2 className={styles.sectionTitle}>
        Try it now.<br />
        <span>No account needed.</span>
      </h2>
      <p>Fill this in and download a real PDF. Sign up when you want to save your invoices and clients.</p>
    </div>
  );
}

export function MadeFor() {
  const people = [
    { img: "/images/home/audience-freelancers.jpg", pos: "50% 25%", title: "Freelancers", text: "Bill each client in their own currency, and see who has paid." },
    { img: "/images/home/audience-designers.jpg", pos: "50% 30%", title: "Designers and creatives", text: "An invoice that looks as good as the work you sent." },
    { img: "/images/home/audience-small-teams.jpg", pos: "50% 20%", title: "Small teams", text: "One place for every client, every invoice and every payment." },
  ];
  return (
    <section className={styles.madeFor}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          Made for people<br />
          <span>who bill for their work.</span>
        </h2>
        <div className={styles.peopleGrid}>
          {people.map((p) => (
            <article key={p.title} className={styles.person}>
              <div
                className={styles.personPhoto}
                style={{ backgroundImage: `url(${p.img})`, backgroundPosition: p.pos }}
                aria-hidden="true"
              />
              <div className={styles.personText}>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
