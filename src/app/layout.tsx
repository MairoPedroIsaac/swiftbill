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

export const metadata: Metadata = {
  metadataBase: new URL("https://swiftbill-swart.vercel.app"),
  title: "SwiftBill | Professional Invoicing",
  description: "Manage clients, track items, and create professional PDF invoices instantly. The ultimate invoicing platform for freelancers and small businesses.",
  applicationName: "SwiftBill",
  // Preview image, favicon and app icons come from the files in this folder:
  // opengraph-image.jpg, twitter-image.jpg, icon.png, apple-icon.png, favicon.ico
  openGraph: {
    title: "SwiftBill | Professional Invoicing",
    description: "Manage clients, track items, and create professional PDF invoices instantly. The ultimate invoicing platform for freelancers and small businesses.",
    url: "https://swiftbill-swart.vercel.app",
    siteName: "SwiftBill",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftBill | Professional Invoicing",
    description: "Manage clients, track items, and create professional PDF invoices instantly.",
  },
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="mesh-bg"></div>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
