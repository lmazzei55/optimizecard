import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { Footer } from "@/components/Footer";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Credit Card Optimizer - Maximize Your Rewards",
  description: "Maximize your credit card rewards with AI-powered personalized recommendations based on your spending patterns. Get mathematical precision for optimal card selection.",
  keywords: "credit cards, rewards, cashback, points, optimization, recommendations, personal finance, credit card comparison, best credit cards",
  authors: [{ name: "Credit Card Optimizer" }],
  creator: "Credit Card Optimizer",
  publisher: "Credit Card Optimizer",
  robots: "index, follow",
  openGraph: {
    title: "Credit Card Optimizer - Maximize Your Rewards",
    description: "AI-powered credit card recommendations based on your spending patterns. Find the perfect card for maximum rewards.",
    url: "https://optimizecard.com",
    siteName: "Credit Card Optimizer",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Credit Card Optimizer - Maximize Your Rewards",
    description: "AI-powered credit card recommendations based on your spending patterns.",
    creator: "@optimizecard",
  },
  alternates: {
    canonical: "https://optimizecard.com",
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" }
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="fo-verify" content="18b08b14-7fe2-4741-aaa8-2295d85db8c7" />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 min-h-screen transition-all duration-500`}
      >
        <SessionProvider>
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
