
import { useRouter, Link } from 'buncf/router';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <div className="max-w-6xl mx-auto px-6 py-20 space-y-24">
        
        {/* Hero Section */}
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Buncf v0.1.0 Experimental
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter sm:text-7xl">
              Build <span className="text-primary italic">Fast</span>.<br />
              Deploy <span className="text-primary tracking-widest uppercase">Edge</span>.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              Experimental full-stack framework for Bun + Cloudflare Workers. 
              Zero configuration, max performance.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <button
              onClick={() => router.push('/about')}
              className="h-14 px-10 bg-primary text-primary-foreground font-bold rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Get Started
            </button>
            <button
               onClick={() => router.back()}
               className="h-14 px-10 bg-secondary text-secondary-foreground font-bold rounded-2xl border border-border hover:bg-muted transition-all duration-300"
            >
              Back Home
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 to-transparent blur-3xl -z-10" />
          
          {/* Section: Dynamic Pages */}
          <div className="group relative rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-2xl hover:border-primary/50 transition-all duration-500 overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
             </div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Standard Pages</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Automatic code splitting, prefetching, and seamless SPA navigation.
            </p>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="flex items-center justify-between group/link text-sm font-semibold text-primary hover:translate-x-1 transition-transform">
                  About Company <span className="group-hover/link:opacity-100 opacity-0 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="/blog/hello-world" className="flex items-center justify-between group/link text-sm font-semibold text-primary hover:translate-x-1 transition-transform">
                  Blog Post <span className="group-hover/link:opacity-100 opacity-0 transition-opacity">→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Section: Advanced Features */}
          <div className="group relative rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-2xl hover:border-primary/50 transition-all duration-500 overflow-hidden">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Modern Stack</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              New features for data fetching, dynamic metadata, and pre-loading.
            </p>
            <ul className="space-y-4">
              <li>
                <Link href="/loader-test" className="flex items-center justify-between group/link text-sm font-semibold text-primary hover:translate-x-1 transition-transform">
                  Loader Test (3s) <span className="group-hover/link:opacity-100 opacity-0 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="/meta-test" className="flex items-center justify-between group/link text-sm font-semibold text-primary hover:translate-x-1 transition-transform">
                  SEO Meta Test <span className="group-hover/link:opacity-100 opacity-0 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="/hooks-test" className="flex items-center justify-between group/link text-sm font-semibold text-primary hover:translate-x-1 transition-transform">
                  Hooks (Fetcher) <span className="group-hover/link:opacity-100 opacity-0 transition-opacity">→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Section: API Routes */}
          <div className="group relative rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-2xl hover:border-primary/50 transition-all duration-500 overflow-hidden">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Edge API</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Native handlers for Bun and Cloudflare Workers with type-safety.
            </p>
            <ul className="space-y-4">
              <li>
                <a href="/api/hello" target="_blank" className="flex items-center justify-between group/link text-sm font-semibold text-primary hover:translate-x-1 transition-transform">
                   /api/hello <span className="group-hover/link:opacity-100 opacity-0 transition-opacity">→</span>
                </a>
              </li>
               <li>
                <Link href="/users/1" className="flex items-center justify-between group/link text-sm font-semibold text-primary hover:translate-x-1 transition-transform">
                   Nested Params <span className="group-hover/link:opacity-100 opacity-0 transition-opacity">→</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Debug Mini-Dashboard */}
        <section className="rounded-3xl border border-primary/10 bg-gradient-to-br from-card to-background p-10 overflow-hidden relative group">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-8 flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
            Active Route Debugger
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 font-mono text-xs">
            <div className="space-y-3 p-4 rounded-2xl bg-black/20 ring-1 ring-white/5">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-widest">Pathname</span>
              <span className="text-primary font-bold text-lg">{router.pathname}</span>
            </div>
            <div className="space-y-3 p-4 rounded-2xl bg-black/20 ring-1 ring-white/5">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-widest">Params</span>
              <pre className="text-foreground/90 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(router.params, null, 2)}</pre>
            </div>
            <div className="space-y-3 p-4 rounded-2xl bg-black/20 ring-1 ring-white/5">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-widest">Query</span>
              <pre className="text-foreground/90 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(router.query, null, 2)}</pre>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
