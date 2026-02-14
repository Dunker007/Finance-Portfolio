import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { PortfolioProvider } from '@/context/PortfolioContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Folio - AI Crypto Tracker',
  description: 'AI-powered crypto portfolio management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased text-sm`}>
        <PortfolioProvider>
          <div className="flex w-full min-h-screen">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-[#0b0e11]">
              {children}
            </main>
          </div>
        </PortfolioProvider>
      </body>
    </html>
  );
}
