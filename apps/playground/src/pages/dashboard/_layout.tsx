
import { type ReactNode } from "react";
import { Link, usePathname } from "buncf/router";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/dashboard" },
    { label: "Settings", href: "/dashboard/settings" },
    { label: "Exit", href: "/" },
  ];

  return (
    <div className="flex h-[500px] border border-border rounded-3xl overflow-hidden bg-card/30 backdrop-blur-sm mt-8">
      <aside className="w-64 border-r border-border bg-muted/20 p-6 flex flex-col">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-8">Management</h3>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="pt-6 border-t border-border mt-auto">
            <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary animate-pulse" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">System Healthy</p>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight italic uppercase">Workspace</h2>
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20" />
        </div>
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {children}
        </div>
      </main>
    </div>
  );
}
