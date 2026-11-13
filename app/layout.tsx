import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '1. Sınıf Hızlı Okuma Atölyesi',
  description:
    '5 ses grubuna (ANETİL, OKURIM, ÜSÖYDZ, ÇBGCŞ, PHVĞFJ) uyumlu, yapay zeka destekli 1. sınıf hızlı okuma ve akıcılık atölyesi.',
  openGraph: {
    title: '1. Sınıf Hızlı Okuma Atölyesi',
    description:
      '5 ses grubuna (ANETİL, OKURIM, ÜSÖYDZ, ÇBGCŞ, PHVĞFJ) uyumlu, yapay zeka destekli 1. sınıf hızlı okuma ve akıcılık atölyesi.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '1. Sınıf Hızlı Okuma Atölyesi',
    description:
      '5 ses grubuna (ANETİL, OKURIM, ÜSÖYDZ, ÇBGCŞ, PHVĞFJ) uyumlu, yapay zeka destekli 1. sınıf hızlı okuma ve akıcılık atölyesi.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body
        className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-blue-100 selection:text-blue-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
