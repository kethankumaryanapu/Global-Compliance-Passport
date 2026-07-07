import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from 'sonner';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Global Compliance Passport | Trusted Digital Identity for Startups',
  description:
    'Create a trusted reusable compliance identity for your startup. Process documents with AI extraction, verify credentials, and share securely with banks, investors, and institutions.',
  keywords: [
    'compliance',
    'startup identity',
    'document verification',
    'reusable passport',
    'KYC',
    'GST',
    'PAN',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans antialiased bg-background text-foreground transition-colors duration-300">
        <AppProvider>
          {children}
          <Toaster position="top-right" theme="dark" closeButton richColors />
        </AppProvider>
      </body>
    </html>
  );
}
