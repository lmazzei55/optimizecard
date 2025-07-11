import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { Footer } from "@/components/Footer";
import { ClientProviders } from "@/components/ClientProviders";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteConfig = {
  title: "Credit Card Optimizer - Maximize Your Rewards",
  description: "Maximize your credit card rewards with AI-powered personalized recommendations based on your spending patterns. Get mathematical precision for optimal card selection.",
  url: "https://www.optimizecard.com",
}

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s - Credit Card Optimizer`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: "Credit Card Optimizer",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: "@optimizecard",
  },
  robots: "index, follow",
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
  authors: [{ name: "Credit Card Optimizer" }],
  creator: "Credit Card Optimizer",
  publisher: "Credit Card Optimizer",
  keywords: "credit cards, rewards, cashback, points, optimization, recommendations, personal finance, credit card comparison, best credit cards",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" }
  ],
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
        {/* Google Analytics GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GZ4LCCCLDY"
          strategy="afterInteractive"
        />
        <Script id="ga-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GZ4LCCCLDY');
          `}
        </Script>
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 min-h-screen transition-all duration-500`}
        suppressHydrationWarning
        data-new-gr-c-s-check-loaded=""
        data-gr-ext-installed=""
      >
        <SessionProvider>
          <ClientProviders>
            {children}
            <Footer />
          </ClientProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
