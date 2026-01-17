
import { type ReactNode } from "react";
import { Link, usePathname } from "buncf/router";

export default function BlogLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Blog Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/blog" className="text-xl font-black italic tracking-tighter text-primary">
            THE_ENGINE <span className="text-foreground not-italic font-medium">BLOG</span>
          </Link>
          <nav className="flex gap-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        {/* Main Content */}
        <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </main>

        {/* Sidebar (Nested) */}
        <aside className="w-full md:w-72 space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
          <section className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Recent Posts</h3>
             <ul className="space-y-4">
                {[
                  { title: "Hello World", slug: "hello-world" },
                  { title: "Why Buncf?", slug: "why-buncf" },
                  { title: "Edge Performance", slug: "edge-performance" }
                ].map(post => (
                  <li key={post.slug}>
                    <Link 
                      href={`/blog/${post.slug}`}
                      className={`block text-sm font-bold border-l-2 pl-4 py-1 transition-all ${
                        pathname === `/blog/${post.slug}` 
                          ? "border-primary text-primary" 
                          : "border-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
             </ul>
          </section>

          <section className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
             <p className="text-xs font-bold text-primary italic">Inside Nested Layout</p>
             <p className="text-[11px] text-muted-foreground leading-relaxed">
               This sidebar is part of <code>/blog/_layout.tsx</code> and persists across all blog posts.
             </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
