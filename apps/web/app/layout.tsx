import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EOD Stock Analyzer',
  description: 'Professional stock analysis and portfolio management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100`}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
            <p>EOD Stock Analyzer © 2025 - Professional Trading Platform</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

