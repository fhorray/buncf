/**
 * Root Layout
 * Wraps all pages
 */
import { Link, usePathname } from 'buncf/router';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            Buncf App
          </Link>

          <div className="flex gap-6">
            <NavLink href="/" active={pathname === '/'}>
              Home
            </NavLink>
            <NavLink href="/about" active={pathname === '/about'}>
              About
            </NavLink>
            <NavLink href="/users" active={pathname.startsWith('/users')}>
              Users
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Built with Bun + Cloudflare Workers</p>
          <p className="mt-2">
            <a
              href="https://github.com/francyelton/buncf"
              className="hover:text-gray-900 underline"
            >
              View on GitHub
            </a>
          </p>
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
      className={`text-sm font-medium transition-colors ${
        active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  );
}
