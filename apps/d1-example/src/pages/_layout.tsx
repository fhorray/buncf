import { Link, useRouter } from "buncf/router";
import { Zap, LogOut, User, Layout as LayoutIcon } from "lucide-react";



export default function Layout({ children }: { children: React.ReactNode }) {
  
  const { pathname } = useRouter();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/playground", label: "Playground" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Zap className="text-blue-500 fill-blue-500" size={24} />
              <span>Buncf</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-primary"}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground bg-muted/20">
        <p>&copy; {new Date().getFullYear()} Buncf Framework. Built with Bun & Cloudflare.</p>
      </footer>
    </div>
  );
}
