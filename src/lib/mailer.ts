import nodemailer from "nodemailer";

/**
 * Sends email through any SMTP server (Gmail with an app password works).
 * Needs SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM.
 * Without them, in development the email is printed to the terminal instead.
 */
export function mailerConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(opts: { to: string; subject: string; text: string; html: string }) {
  if (!mailerConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[SwiftBill email, not sent: SMTP is not set up]\nTo: ${opts.to}\nSubject: ${opts.subject}\n\n${opts.text}\n`);
      return;
    }
    throw new Error("Email is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    // Google shows app passwords in groups of 4; spaces are not part of the password
    auth: { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS || "").replace(/\s+/g, "") },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `SwiftBill <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
