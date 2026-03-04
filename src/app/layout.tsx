import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'ReStyle — Second-Hand Fashion Marketplace',
  description: 'Buy and sell second-hand clothing. Give your clothes a second life with ReStyle.',
  keywords: ['second-hand', 'clothing', 'marketplace', 'fashion', 'sustainable', 'vinted'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased bg-white text-gray-900 min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
