# SwiftBill Project Roadmap & Progress

## Phase 1: MVP & Core Invoicing (✅ Completed)
- [x] Basic Next.js setup with App Router
- [x] Prisma + Supabase PostgreSQL Database Setup
- [x] Guest Invoice Builder (No login required)
- [x] Client-side PDF Generation with Templates
- [x] User Authentication (NextAuth + Google OAuth)
- [x] Dashboard Analytics (Pending, Paid, Totals)
- [x] Invoice CRUD (Create, Read, Update, Delete)

## Phase 2: UI Polish & UX Improvements (🚧 In Progress)
- [x] Add toast notifications for successful actions and errors (React-Hot-Toast)
- [x] Fix unauthenticated user flow for downloading invoices silently
- [x] Clean up confusing button text ("Download PDF & Save" -> "Download PDF")
- [ ] Polish PDF templates styling (Fonts, Alignment, Spacing)
- [ ] Add loading skeletons for dashboard
- [ ] Improve mobile responsiveness for the invoice table

## Phase 3: Advanced Features (📅 Planned)
- [ ] Email Delivery: Send invoice directly to client's email via SMTP (e.g. Resend / SendGrid)
- [ ] Custom Branding: Allow users to upload their own logo for the PDF templates
- [ ] Payment Links: Integrate Stripe to allow clients to pay the invoice online
- [ ] Multi-currency support
- [ ] Recurring Invoices

## Phase 4: Scaling & Expansion (📅 Planned)
- [ ] Export invoices to CSV / Excel
- [ ] Client Management Address Book (Save client details automatically)
- [ ] Multi-tenant support (Multiple businesses per user)
