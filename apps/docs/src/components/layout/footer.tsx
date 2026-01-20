import { Link } from 'buncf/router';
import { Github, Twitter, Terminal } from 'lucide-react';

const footerLinks = {
  Documentation: [
    { label: 'Getting Started', href: '/docs' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Examples', href: '/docs/examples' },
    { label: 'CLI Commands', href: '/docs/cli' },
  ],
  Resources: [
    { label: 'GitHub', href: 'https://github.com/francyelton/buncf' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Contributing', href: '/contributing' },
  ],
  Community: [
    { label: 'Discord', href: '#' },
    { label: 'Twitter', href: '#' },
    { label: 'Discussions', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neon/20 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-neon" />
              </div>
              <span className="font-bold text-xl">
                bun<span className="text-neon">cf</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              The Bun Framework for Cloudflare Workers. Build fast, deploy
              faster.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/francyelton/buncf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            MIT License. Built with Bun and Cloudflare Workers.
          </p>
          <p className="text-sm text-muted-foreground">
            Created by{' '}
            <a
              href="https://github.com/francyelton"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon hover:underline"
            >
              Francyelton Nobre
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
