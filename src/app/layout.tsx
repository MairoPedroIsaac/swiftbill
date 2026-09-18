import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SwiftBill | Professional Invoicing",
  description: "Manage clients, track items, and create professional PDF invoices instantly. The ultimate invoicing platform for freelancers and small businesses.",
  openGraph: {
    title: "SwiftBill | Professional Invoicing",
    description: "Manage clients, track items, and create professional PDF invoices instantly. The ultimate invoicing platform for freelancers and small businesses.",
    url: "https://swiftbill-app.vercel.app", // Replace with your actual Vercel URL
    siteName: "SwiftBill",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SwiftBill Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftBill | Professional Invoicing",
    description: "Manage clients, track items, and create professional PDF invoices instantly.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="mesh-bg"></div>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
