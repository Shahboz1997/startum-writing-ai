import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Providers } from "../components/Providers";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://stratum.ai';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'STRATUM.ai — Premium IELTS Intelligence',
    template: '%s | STRATUM.ai',
  },
  description:
    'Elevate your IELTS score with Stratum. Precision AI-driven evaluation for Task 1 and Task 2. Master the exam, stratum by stratum.',
  keywords: [
    'IELTS writing',
    'IELTS essay scorer',
    'AI IELTS examiner',
    'Band 9 feedback',
    'Task 1 Task 2',
    'IELTS preparation',
    'academic writing',
    'English language assessment',
    'STRATUM',
  ],
  authors: [{ name: 'STRATUM.ai', url: baseUrl }],
  creator: 'STRATUM.ai',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'STRATUM',
    title: 'STRATUM.ai | Next-Gen IELTS Preparation',
    description: 'Get instant Band 9.0 feedback and AI-powered essay analysis.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STRATUM.ai | Next-Gen IELTS Preparation',
    description: 'Get instant Band 9.0 feedback and AI-powered essay analysis.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KEPXR00JYF"
          strategy="afterInteractive"
        />
        <Script id="google-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KEPXR00JYF');
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#F9FAFB] text-slate-900 dark:bg-[#050505] dark:text-slate-100 transition-colors duration-500 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
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
//   title: "STRATUM.ai | AI IELTS Writing Checker & Examiner",
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
