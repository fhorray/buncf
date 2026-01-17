/**
 * Home Page Component
 * URL: /
 *
 * Demonstrates: useRouter hook for navigation
 */
import { useRouter, Link } from 'buncf/router';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="text-center space-y-4 pt-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Welcome to <span className="text-primary">Buncf</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experimental file-system routing for Bun + Cloudflare Workers. 
          Build fast edge applications with zero overhead.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => router.push('/about')}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Get Started
          </button>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-full border border-border hover:bg-muted transition-all"
          >
            Documentation
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Navigation Section */}
        <div className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Pages</h2>
          <p className="text-muted-foreground mb-6">
            Client-side routing with automatic code splitting and prefetching.
          </p>
          <ul className="space-y-3">
            <li>
              <Link href="/about" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <span>→</span> About Company
              </Link>
            </li>
            <li>
              <Link href="/about" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <span>→</span> Hello World Post
              </Link>
            </li>
            <li>
              <Link href="/users" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <span>→</span> User Directory
              </Link>
            </li>
          </ul>
        </div>

        {/* API Routes Section */}
        <div className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">API Routes</h2>
          <p className="text-muted-foreground mb-6">
            Universal handler support for both Bun and Cloudflare Workers.
          </p>
          <ul className="space-y-3">
            <li>
              <a href="/api/hello" target="_blank" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <span>→</span> GET /api/hello
              </a>
            </li>
            <li>
              <a href="/api/users" target="_blank" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <span>→</span> GET /api/users
              </a>
            </li>
            <li>
              <a href="/api/users/1" target="_blank" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <span>→</span> GET /api/users/1
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Debug Info */}
      <div className="rounded-xl border bg-muted/50 p-6 overflow-hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Next.js Style Debug Manifest
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground block text-[10px] uppercase">Pathname</span>
            <span className="text-foreground">{router.pathname}</span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground block text-[10px] uppercase">Params</span>
            <code className="text-foreground">{JSON.stringify(router.params)}</code>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground block text-[10px] uppercase">Query</span>
            <code className="text-foreground">{JSON.stringify(router.query)}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
