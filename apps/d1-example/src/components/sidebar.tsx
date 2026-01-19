import { Link, usePathname } from 'buncf/router';
import {
  LayoutDashboard,
  Database,
  HardDrive,
  Cloud,
  Menu,
  X,
  FileCode,
  Network,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';

type NavItem =
  | {
      type: 'link';
      name: string;
      href: string;
      icon: any;
    }
  | {
      type: 'header';
      name: string;
    };

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    { type: 'header', name: 'Start' },
    { type: 'link', name: 'Overview', href: '/', icon: LayoutDashboard },

    { type: 'header', name: 'Cloudflare Bindings' },
    { type: 'link', name: 'D1 Database', href: '/admin', icon: Database },
    { type: 'link', name: 'KV Storage', href: '/kv-demo', icon: HardDrive },
    { type: 'link', name: 'R2 Buckets', href: '/r2-demo', icon: Cloud },

    { type: 'header', name: 'Framework' },
    {
      type: 'link',
      name: 'File Routing',
      href: '/docs/routing',
      icon: FileCode,
    },
    { type: 'link', name: 'Type-Safe RPC', href: '/docs/rpc', icon: Network },
    {
      type: 'link',
      name: 'Middleware',
      href: '/docs/middleware',
      icon: ShieldAlert,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-card border rounded-md"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <aside
        className={`
        fixed top-0 left-0 z-40 h-screen w-64 
        bg-sidebar border-r border-sidebar-border
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-sidebar-primary-foreground">
              <span className="text-primary">⚡</span> Buncf
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item, index) => {
              if (item.type === 'header') {
                return (
                  <div
                    key={index}
                    className="px-3 pt-4 pb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider"
                  >
                    {item.name}
                  </div>
                );
              }

              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${
                      active
                        ? 'bg-sidebar-primary/10 text-primary border border-primary/20'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }
                  `}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0">
            <div className="bg-sidebar-accent/50 rounded-md p-3 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono text-sidebar-foreground">
                  v0.1.0
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  Stable
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
