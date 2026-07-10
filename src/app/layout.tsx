import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistema de Facturación Residencial',
  description: 'Gestión financiera de residencial — Facturas, Gas, Propietarios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="app-shell">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
