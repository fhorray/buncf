/**
 * Root Layout
 * Wraps all pages
 */
import { Link, usePathname } from 'buncf/router';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      {/* Navbar */}
      <nav className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              B
            </div>
            <span>Buncf App</span>
          </Link>

          <div className="flex items-center gap-1">
            <NavLink href="/" active={pathname === '/'}>
              Home
            </NavLink>
            <NavLink href="/about" active={pathname === '/about'}>
              About
            </NavLink>
            <NavLink href="/users" active={pathname.startsWith('/users')}>
              Users
            </NavLink>
            <NavLink href="/blog" active={pathname.startsWith('/blog')}>
              Blog
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Buncf</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a
              href="https://github.com/francyelton/buncf"
              className="hover:text-foreground underline underline-offset-4 transition-colors"
            >
              GitHub
            </a>
            <span className="text-muted-foreground/50">Built with Bun + Cloudflare</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
        active 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  );
}
