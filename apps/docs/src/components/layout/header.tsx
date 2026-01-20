'use client';

import { Link } from 'buncf/router';
import { useState } from 'react';
import { Menu, X, Github, Book, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Docs', href: '/docs' },
  { label: 'API Reference', href: '/docs/api' },
  { label: 'Examples', href: '/docs/examples' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-neon/20 flex items-center justify-center group-hover:bg-neon/30 transition-colors">
            <Terminal className="w-4 h-4 text-neon" />
          </div>
          <span className="font-bold text-xl">
            bun<span className="text-neon">cf</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/francyelton/buncf"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-neon hover:bg-neon/90 text-primary-foreground gap-2"
          >
            <Link href="/docs">
              <Book className="w-4 h-4" />
              Get Started
            </Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl',
          mobileMenuOpen ? 'block' : 'hidden',
        )}
      >
        <div className="px-6 py-4 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border/50 flex items-center gap-4">
            <a
              href="https://github.com/francyelton/buncf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="w-5 h-5" />
            </a>
            <Button
              asChild
              size="sm"
              className="bg-neon hover:bg-neon/90 text-primary-foreground"
            >
              <Link href="/docs">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
