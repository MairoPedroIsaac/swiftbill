import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | SwiftBill",
  description: "How SwiftBill collects, uses and protects your information.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          SwiftBill is an invoicing tool. This page explains what information we collect when you use it,
          why we need it, and the choices you have. We only collect what we need to run the service, and we
          never sell your data.
        </p>
      }
    >
      <h2>Information we collect</h2>
      <p><strong>Account details.</strong> When you sign up we store your name, email address and, if you choose, a profile photo.</p>
      <ul>
        <li>If you sign up with email and password, your password is stored as a one-way hash. We cannot see it.</li>
        <li>
          If you sign in with Google, Google shares your name, email address and profile picture with us. We use the
          basic sign-in permissions only (openid, email and profile). We cannot read your Gmail, Drive, contacts or
          anything else in your Google account.
        </li>
      </ul>
      <p>
        <strong>Business and invoice data.</strong> Anything you enter to create invoices: your business name, address,
        email and phone, your clients and their details, saved items and rates, invoice numbers, amounts, notes and terms.
      </p>
      <p>
        <strong>Data stored in your browser.</strong> We use a session cookie to keep you signed in. The invoice builder
        also saves an unfinished draft in your browser&apos;s local storage so you don&apos;t lose your work. We do not
        use advertising or tracking cookies.
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>To create and secure your account and sign you in.</li>
        <li>To save your clients, items and invoices and generate PDF invoices for you.</li>
        <li>To fill in your business details automatically on new invoices.</li>
        <li>To keep the service working, fix problems and prevent abuse.</li>
      </ul>
      <p>We do not sell, rent or share your information for advertising.</p>

      <h2>Where your data is stored</h2>
      <p>We use a small number of trusted providers to run SwiftBill:</p>
      <ul>
        <li><strong>Vercel</strong> hosts the website and runs the app.</li>
        <li><strong>Supabase</strong> hosts the database where your account and invoice data is stored.</li>
        <li><strong>Google</strong> handles sign-in if you choose &quot;Continue with Google&quot;.</li>
      </ul>
      <p>
        These providers process data on our behalf and may store it in data centres outside your country. Data is
        sent over encrypted connections (HTTPS).
      </p>

      <h2>Google user data</h2>
      <p>
        SwiftBill&apos;s use of information received from Google APIs follows the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. We only use your Google name, email and picture to create and sign in
        to your SwiftBill account. We do not transfer this data to anyone else and do not use it for advertising.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your information for as long as your account is active. If you ask us to delete your account, we delete
        your account and invoice data from our database within 30 days, apart from anything we must keep by law.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>You can update your name, photo and business details at any time in your dashboard.</li>
        <li>You can ask us for a copy of your data, or ask us to correct or delete it.</li>
        <li>
          If you signed in with Google, you can remove SwiftBill&apos;s access at any time from your{" "}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google account permissions</a>.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        We use encrypted connections, hashed passwords and access controls to protect your data. No online service can
        promise perfect security, so please use a strong password and keep it private.
      </p>

      <h2>Children</h2>
      <p>SwiftBill is meant for businesses and freelancers. It is not intended for anyone under 16.</p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy we will update the date at the top of this page. For important changes we will let you
        know by email or in the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests about your data? Email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        You can also read our <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
