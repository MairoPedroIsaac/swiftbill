import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://swiftbill-swart.vercel.app";
const SITE_TITLE = "SwiftBill | Professional Invoicing";
const SITE_DESCRIPTION =
  "Manage clients, track items, and create professional PDF invoices in seconds. Invoicing for freelancers and small businesses.";
// Bump the ?v= number whenever public/og.jpg changes so apps fetch the new image.
const OG_IMAGE = `${SITE_URL}/og.jpg?v=4`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "SwiftBill",
  // Favicon and app icons come from favicon.ico, icon.png and apple-icon.png in this folder.
  // Link preview tags (og:*, twitter:*) are written straight into <head> below.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/*
          Link preview tags for WhatsApp, Facebook, LinkedIn, X, Slack and others.
          They are written here by hand so they are always in the HTML <head>,
          on every page and for every app that reads them.
        */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SwiftBill" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:secure_url" content={OG_IMAGE} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="SwiftBill: professional invoices in seconds" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="mesh-bg"></div>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0b1730",
              color: "#fff",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "0.95rem",
              boxShadow: "0 12px 32px rgba(7, 13, 26, 0.28)",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#0b1730" } },
            error: { duration: 6000, iconTheme: { primary: "#f87171", secondary: "#0b1730" } },
          }}
        />
      </body>
    </html>
  );
}
