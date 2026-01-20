'use client';

import { Link } from 'buncf/router';
import { usePathname } from 'buncf/router';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Terminal,
  FolderTree,
  Route,
  RefreshCw,
  Zap,
  Lock,
  Paintbrush,
  Settings,
  Rocket,
  Code2,
  FileCode,
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Introduction', href: '/docs', icon: BookOpen },
      { label: 'Quick Start', href: '/docs/quick-start', icon: Rocket },
      { label: 'Installation', href: '/docs/installation', icon: Terminal },
      { label: 'CLI Commands', href: '/docs/cli', icon: Terminal },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { label: 'Project Structure', href: '/docs/structure', icon: FolderTree },
      { label: 'File-System Routing', href: '/docs/routing', icon: Route },
      { label: 'API Routes', href: '/docs/api-routes', icon: Code2 },
      { label: 'Page Routes', href: '/docs/page-routes', icon: FileCode },
    ],
  },
  {
    title: 'Features',
    items: [
      { label: 'React Router', href: '/docs/router', icon: Route },
      { label: 'Data Fetching', href: '/docs/fetching', icon: RefreshCw },
      { label: 'Server Actions', href: '/docs/actions', icon: Zap },
      { label: 'Magic Bindings', href: '/docs/bindings', icon: Lock },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { label: 'Layouts & Metadata', href: '/docs/layouts', icon: FileCode },
      { label: 'Middleware', href: '/docs/middleware', icon: Settings },
      { label: 'Styling', href: '/docs/styling', icon: Paintbrush },
      { label: 'Deployment', href: '/docs/deployment', icon: Rocket },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border/50 bg-sidebar h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden lg:block">
      <nav className="p-4 space-y-6">
        {sidebarItems.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                        isActive
                          ? 'bg-neon/10 text-neon font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
