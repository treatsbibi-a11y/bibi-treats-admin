import type { Metadata } from 'next';
import { Rubik, Prompt } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './globals.css';
import AdminShell from '@/components/admin/AdminShell';

config.autoAddCss = false;

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-rubik',
  display: 'swap',
});

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Bibi's Treats | Admin Operations Console",
  description: 'Operations console for managing products, orders, inventory, and reports.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧁</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${rubik.variable} ${prompt.variable} scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Rubik:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F8FBFE] text-slate-800 antialiased selection:bg-brand-100 selection:text-brand-900">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
