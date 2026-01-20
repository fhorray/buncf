import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { usePathname } from 'buncf/router';
import React, { useEffect, useState } from 'react';

/**
 
export const metadata: Metadata = {
  title: 'buncf - The Bun Framework for Cloudflare Workers',
  description: 'Build full-stack React apps with file-system routing, type-safe APIs, and zero-config deployment to the edge.',
  generator: 'buncf',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}
 */

export const meta = () => [
  { title: 'Buncf - The Bun Framework for Cloudflare' },
  { name: 'description', content: 'Documentation for Buncf framework' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
