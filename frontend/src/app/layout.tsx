import './globals.css';
import { Metadata } from 'next';
import React from 'react';
import WalletContextProvider from './WalletContextProvider';

export const metadata: Metadata = {
  title: 'Kirble — One line. Any AI agent.',
  description: 'Describe an agent in one sentence, give it a character, and launch it powered by the best AI models. No code.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
