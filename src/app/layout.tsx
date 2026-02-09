import type { Metadata } from 'next'
import { defaultLocale } from '@/i18n/config'
// import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: 'BlinkVocab - Vocabulary Learning Dashboard',
  description: 'Master vocabulary with spaced repetition',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={defaultLocale}>
      <body className={`antialiased`}>{children}</body>
    </html>
  )
}
