import React from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/docs/sidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 min-w-0 max-w-4xl">{children}</main>
      </div>
    </div>
  );
}
