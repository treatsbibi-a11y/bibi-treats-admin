import type { Metadata } from 'next';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './globals.css';
import AdminShell from '@/components/admin/AdminShell';

config.autoAddCss = false;

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
    <html lang="th" className="antialiased">
      <body className="font-sans min-h-screen bg-[#FAFCFE] text-[#0F172A] selection:bg-[#E0F2FE] selection:text-[#0284C7] overflow-x-hidden">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
