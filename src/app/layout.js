import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import AppThemeProvider from "@/components/AppThemeProvider";
import { Providers } from "../components/Providers";
import { safeAuth } from "@/lib/safeAuth";
import { getMetadataBaseUrl } from "@/lib/publicSiteUrl";
import { LEGAL_COMPANY_NAME } from "@/lib/support";
import LandingJsonLd from "@/components/landing/LandingJsonLd";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = getMetadataBaseUrl();

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'STRATUM — IELTS Writing Task 1 & Task 2 AI Examiner',
    template: '%s | STRATUM',
  },
  description:
    'Catches Task 1 data errors and scores Task 1 & Task 2 like an examiner in ~30 seconds. Free demo, then sign in for full criteria, fixes, and rewrite. Practice estimates only.',
  keywords: [
    'IELTS writing',
    'IELTS essay scorer',
    'AI IELTS examiner',
    'Task 1 Task 2',
    'IELTS preparation',
    'academic writing',
    'GT letter IELTS',
    'STRATUM',
  ],
  authors: [{ name: LEGAL_COMPANY_NAME, url: baseUrl }],
  creator: LEGAL_COMPANY_NAME,
  publisher: LEGAL_COMPANY_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'STRATUM',
    title: 'STRATUM — IELTS Writing Task 1 & Task 2 AI Examiner',
    description:
      'Catches Task 1 data errors and scores Task 1 & Task 2 like an examiner in ~30 seconds. Practice estimates only — not an official IELTS score.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STRATUM — IELTS Writing AI Examiner',
    description:
      'Free demo Writing check: 4 criteria, Task 1 logic flags, lexical upgrade, model rewrite. Practice estimates only.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    title: 'STRATUM',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
};

export const viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  // On Vercel, cap server session read so TTFB stays fast on cold start; client SessionProvider fills in.
  const session =
    process.env.VERCEL === "1"
      ? await Promise.race([
          safeAuth(),
          new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
        ])
      : await safeAuth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#F9FAFB] text-slate-900 min-h-screen`}
      >
        <LandingJsonLd />
        <AppThemeProvider>
          <Providers session={session}>
            {children}
          </Providers>
        </AppThemeProvider>
        <Analytics />
        {/* lazyOnload: keep Ads LP LCP lighter; conversions still fire after load */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KEPXR00JYF"
          strategy="lazyOnload"
        />
        <Script id="google-gtag" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KEPXR00JYF');
            gtag('config', 'AW-18107551498');
          `}
        </Script>
      </body>
    </html>
  );
}

// // Было: import { Geist, Geist_Mono } from "next-font/google";
// import { Geist, Geist_Mono } from "next/font/google"; // ИСПРАВЛЕНО

// import './globals.css';
// //import { SessionProvider } from "next-auth/react"; // 1. Импортируем провайдер

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata = {
//   metadataBase: new URL(
//     process.env.NODE_ENV === 'development' 
//       ? 'http://localhost:3000' 
//       : 'https://stratum.ai'
//   ),
//   title: "stratum | AI IELTS Writing Checker & Examiner",
//   description: "Improve your IELTS Writing score with AI...",
//   // ... остальные метаданные
// };

// export const viewport = {
//   themeColor: "#4f46e5",
//   width: "device-width",
//   initialScale: 1,
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
//         {/* 2. Оборачиваем все приложение, чтобы useSession заработал в Navbar */}
//         {/* <SessionProvider>
//           {children}
//         </SessionProvider> */}
//       </body>
//     </html>
//   );
// }
