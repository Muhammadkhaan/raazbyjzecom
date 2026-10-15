import React from 'react';
import '@/app/globals.css';

export const metadata = {
  title: 'Laam Luxury Atelier | Designer Pret & Festive Couture',
  description: 'Shop authentic handcrafted designer Pret, Festive, and Formal ensembles with global express shipping.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
