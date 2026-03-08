import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://stratum.ai'
  ),
  title: 'STRATUM.ai | AI-Powered IELTS Writing Examiner & Essay Scorer',
  description:
    'Get instant Band 9.0 feedback on your IELTS Task 1 and Task 2. Our AI examiner analyses your grammar, vocabulary, and coherence using official criteria.',
  keywords: [
    'IELTS writing',
    'IELTS essay scorer',
    'AI IELTS examiner',
    'Band 9 feedback',
    'Task 1 Task 2',
    'IELTS preparation',
    'academic writing',
    'English language assessment',
  ],
  authors: [{ name: 'STRATUM.ai' }],
  openGraph: {
    type: 'website',
    title: 'Boost Your IELTS Score with AI | STRATUM.ai',
    description:
      'Stop guessing your score. Get detailed academic evaluation for Task 1 and Task 2 in seconds.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Master IELTS Writing with STRATUM.ai',
    description:
      'Stop guessing your score. Get detailed academic evaluation for Task 1 and Task 2 in seconds.',
    images: ['/og-image.png'],
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
