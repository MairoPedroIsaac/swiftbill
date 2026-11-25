<div align="center">

# SwiftBill

**Invoices that get you paid.**

Save your clients once. Send clean, professional PDF invoices in under a minute, from your laptop or your phone.

**[Open the live app](https://swiftbill-swart.vercel.app/)** &nbsp;·&nbsp; **[Android app](https://github.com/MairoPedroIsaac/swiftbill-mobile)** &nbsp;·&nbsp; **[Download the APK](https://github.com/MairoPedroIsaac/swiftbill-mobile/releases/latest)**

</div>

![SwiftBill homepage](./screenshots/home-hero.jpg)

![Stats band and how it works](./screenshots/home-stats-steps.jpg)

## Why I built it

SwiftBill gives freelancers and small teams one place for their clients, their items and their invoice history, with a PDF they are proud to send. It works in Rwandan francs as well as dollars, and you can try it without making an account.

It is a portfolio project, built end to end by me: design, frontend, API, database, auth, email and deployment.

## What it does

**Try it before you sign up.** The invoice builder works on the homepage with no account. Your draft saves itself in the browser, so a refresh does not lose your work.

**Three PDF templates, with your logo.** Minimal, Modern and Classic. Upload a logo once and it shows on every invoice. PDFs are made right in the browser.

![The three PDF templates](./screenshots/pdf-templates.jpg)

**Money that looks right.** 12 currencies, including RWF and KES. Rwandan francs print with no cents and proper thousand separators (FRw 1,416,000, not 1416000.00).

**A dashboard that answers "who still owes me?"** Paid so far, drafts waiting to be sent, and unpaid totals at a glance. Mark an invoice Draft, Sent or Paid straight from the list.

![Dashboard](./screenshots/dashboard.jpg)

**It remembers your clients and items.** Type the first letters of a client or a line item and SwiftBill suggests what you used before, with the same rate.

![Invoice builder](./screenshots/invoice-builder.jpg)

**Sign in your way.** Google sign in, or email and password. Forgot your password? A reset link arrives by email and expires after one hour.

![Sign in page](./screenshots/sign-in.jpg)

**Built for phones too.** Every screen is designed for small screens, not just squeezed.

<p align="center">
  <img src="./screenshots/mobile-home.jpg" width="250" alt="SwiftBill homepage on a phone" />
  &nbsp;&nbsp;
  <img src="./screenshots/mobile-dashboard.jpg" width="250" alt="SwiftBill dashboard on a phone" />
  &nbsp;&nbsp;
  <img src="./screenshots/mobile-sign-in.jpg" width="250" alt="SwiftBill sign in on a phone" />
</p>

**Privacy and terms pages.** Because the app uses Google sign in, it has a real [Privacy Policy](https://swiftbill-swart.vercel.app/privacy) and [Terms of Service](https://swiftbill-swart.vercel.app/terms).

## Under the hood

The parts I am most proud of as an engineer:

* **Safe invoice numbers.** INV-001, INV-002 and so on are given out inside a database transaction, so two saves at the same moment can never get the same number.
* **Paid invoices are locked.** Once an invoice is marked Paid, the editor locks it, so a finished record is not changed by mistake.
* **Every request is checked.** API routes validate their input with Zod before touching the database.
* **Pagination on the server.** The invoice list loads 10 at a time, so the dashboard stays fast as the list grows.
* **One API, two apps.** The same routes serve this website and the Android app. They accept either a NextAuth session cookie (web) or a Bearer token (mobile). See `src/lib/mobileAuth.ts`.
* **Careful password resets.** Reset tokens are stored hashed, expire after an hour, and are sent through SMTP (Gmail app password in production).

## The Android app

SwiftBill also runs as an Android app built with React Native and Expo. It uses the same accounts and the same database, so an invoice made on the phone shows up here, and the other way round.

* Source code: [MairoPedroIsaac/swiftbill-mobile](https://github.com/MairoPedroIsaac/swiftbill-mobile)
* Download: [latest APK](https://github.com/MairoPedroIsaac/swiftbill-mobile/releases/latest)

This repo holds the small mobile API layer the app needs:

* `POST /api/mobile/login` returns a signed token for email and password sign in
* `/mobile-auth` runs Google sign in on the web, then hands a token back to the app through a deep link (`swiftbillmobile://`)

## Tech stack

| Part | Tool |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | CSS Modules, hand written. No UI kit. |
| Database | PostgreSQL on Supabase, with Prisma |
| Auth | NextAuth.js (Google and email/password), bcrypt |
| Validation | Zod |
| PDFs | jsPDF and jspdf-autotable |
| Email | Nodemailer over SMTP |
| File storage | Supabase Storage (profile photos) |
| Hosting | Vercel |

## Run it on your computer

**1. Get the code**

```bash
git clone https://github.com/MairoPedroIsaac/swiftbill.git
cd swiftbill
npm install
```

**2. Add your settings.** Make a file called `.env` in the project folder. Never commit it.

```env
# Supabase Postgres. Port 6543 is the pooler (for the app), 5432 is direct (for migrations).
DATABASE_URL="postgres://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://USER:PASSWORD@HOST:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-long-random-string"

# Google sign in
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Profile photo uploads (optional)
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."

# Password reset emails (optional). Without these, the reset link prints in the terminal.
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="you@gmail.com"
SMTP_PASS="your-gmail-app-password"
MAIL_FROM="SwiftBill <you@gmail.com>"
```

**3. Set up the database**

```bash
npx prisma db push
```

**4. Start it**

```bash
npm run dev
```

Then open http://localhost:3000.

## What it does not do (on purpose)

I kept the scope tight so every part that is there works well.

* **No online payments.** An invoice is a record and a PDF, not a payment page. No Stripe or MoMo checkout yet.
* **No sending invoices by email from the app.** You download the PDF and send it on email or WhatsApp yourself. (The app does send password reset emails.)
* **No recurring invoices.** Each invoice is made by hand.
* **One person per business.** No team accounts or roles.

## Status

SwiftBill is a finished portfolio project and is live at [swiftbill-swart.vercel.app](https://swiftbill-swart.vercel.app/). It is a real, working app, but it is not offered as a commercial service.

Ideas for later: MoMo payment links, sending invoices by email, recurring invoices, and reports.

---

Built by **Mairo Pedro Isaac**, full-stack developer in Kigali, Rwanda.
