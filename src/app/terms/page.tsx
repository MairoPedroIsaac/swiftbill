import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service | SwiftBill",
  description: "The terms that apply when you use SwiftBill.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          These terms explain the rules for using SwiftBill. By creating an account or using the site, you agree to
          them. If you don&apos;t agree, please don&apos;t use SwiftBill.
        </p>
      }
    >
      <h2>The service</h2>
      <p>
        SwiftBill lets you save business details, clients and items, and create and download invoices as PDFs. The
        service is currently provided free of charge. We may add, change or remove features over time.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must give accurate information when you sign up and keep your login details safe.</li>
        <li>You are responsible for everything that happens under your account.</li>
        <li>You must be at least 16 years old to use SwiftBill.</li>
        <li>Tell us straight away if you think someone else has accessed your account.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own the information you put into SwiftBill, including your clients, items and invoices. You give us
        permission to store and process it only so we can run the service for you. You are responsible for making sure
        your invoices are accurate and that you have the right to use any client details you enter.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use SwiftBill for fraud, fake invoices or anything illegal;</li>
        <li>try to access other people&apos;s accounts or data;</li>
        <li>disrupt, overload or try to break the service or its security;</li>
        <li>copy, resell or reverse engineer the service.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules.</p>

      <h2>Taxes and legal requirements</h2>
      <p>
        SwiftBill is a tool for creating invoices. It is not accounting, tax or legal advice. You are responsible for
        the content of your invoices and for meeting the tax and invoicing rules that apply to your business.
      </p>

      <h2>Availability</h2>
      <p>
        We work to keep SwiftBill running and your data safe, but we can&apos;t promise the service will always be
        available or free of errors. Please keep your own copies of important invoices, for example by downloading the
        PDFs.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        SwiftBill is provided &quot;as is&quot;. To the extent the law allows, we are not liable for indirect losses,
        lost profits or lost data that result from using or being unable to use the service.
      </p>

      <h2>Closing your account</h2>
      <p>
        You can stop using SwiftBill at any time and ask us to delete your account. We may close accounts that break
        these terms or that have been inactive for a long time, and will try to warn you first where we can.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. We will change the date at the top of this page, and for important
        changes we will let you know. If you keep using SwiftBill after a change, you accept the new terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the Republic of Rwanda.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
