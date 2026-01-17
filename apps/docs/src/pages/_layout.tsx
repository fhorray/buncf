import React, { useState, useEffect } from "react";
import { Link, usePathname } from "buncf/router";
import { Github, Menu, X } from "lucide-react";
import { docsConfig } from "@/config/docs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const meta = () => [
  { title: "Buncf - The Bun Framework for Cloudflare" },
  { name: "description", content: "Documentation for Buncf framework" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-pink-500/30">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block text-xl">Buncf</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {docsConfig.mainNav.map((item, index) => (
                 <Link 
                   key={index} 
                   href={item.href} 
                   className={cn(
                     "transition-colors hover:text-foreground/80",
                     pathname === item.href ? "text-foreground" : "text-foreground/60"
                   )}
                   target={item.external ? "_blank" : undefined}
                 >
                   {item.title}
                 </Link>
              ))}
            </nav>
          </div>
          
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 py-2 mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle Menu</span>
          </button>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
             <div className="w-full flex-1 md:w-auto md:flex-none">
                <button className="inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64">
                    <span className="hidden lg:inline-flex">Search documentation...</span>
                    <span className="inline-flex lg:hidden">Search...</span>
                    <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
             </div>
             <nav className="flex items-center">
                <Link href="https://github.com/francyelton/buncf" target="_blank">
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                        <Github className="h-4 w-4" />
                        <span className="sr-only">GitHub</span>
                    </div>
                </Link>
             </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative">
         {children}
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-50 grid h-[calc(100vh-3.5rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden bg-background">
          <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md border">
            <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <span className="font-bold">Buncf</span>
            </Link>
            <nav className="grid grid-flow-row auto-rows-max text-sm">
              {docsConfig.mainNav.map((item, index) => (
                  <Link
                      key={index}
                      href={item.href}
                      className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline"
                      onClick={() => setMobileMenuOpen(false)}
                      target={item.external ? "_blank" : undefined}
                  >
                      {item.title}
                  </Link>
              ))}
            </nav>
            {/* Divider */}
            <div className="border-t my-2" />
            <div className="flex flex-col gap-4">
               {docsConfig.sidebarNav.map((section, index) => (
                  <div key={index} className="flex flex-col space-y-3">
                      <h4 className="font-bold">{section.title}</h4>
                      {section.items.map((item, i) => (
                          <Link
                              key={i}
                              href={item.href}
                              className={cn(
                                "text-muted-foreground hover:text-pink-500",
                                pathname === item.href && "text-pink-500 font-medium"
                              )}
                              onClick={() => setMobileMenuOpen(false)}
                          >
                              {item.title}
                          </Link>
                      ))}
                  </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
