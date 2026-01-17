/**
 * About Page Component
 * URL: /about
 */
import { Link } from 'buncf/router';

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <Link
        href="/"
        className="text-sm font-medium text-primary hover:underline underline-offset-4 mb-8 inline-block"
      >
        ← Back to Home
      </Link>

      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight">About Buncf</h1>
        
        <div className="prose prose-slate dark:prose-invert">
          <p className="text-xl text-muted-foreground leading-relaxed">
            Buncf is a zero-config adapter for deploying Bun applications to
            Cloudflare Workers. It bridge the gap between Bun's native developer 
            experience and Cloudflare's serverless platform.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">Core Principles</h2>
          <ul className="grid grid-cols-1 gap-4 list-none p-0">
            {[
              { title: "File-system Routing", desc: "Automatic routing for pages and API endpoints." },
              { title: "Native Hooks", desc: "Lightweight, specialized hooks for Bun-style routing." },
              { title: "Tailwind Native", desc: "Seamless integration with Tailwind CSS v4." },
              { title: "Zero Dependencies", desc: "No heavy router libraries, just small, fast code." }
            ].map((f, i) => (
              <li key={i} className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-primary">
                <span className="font-bold block text-foreground">{f.title}</span>
                <span className="text-sm text-muted-foreground">{f.desc}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">Quick Start</h2>
          <div className="relative group">
            <pre className="bg-muted text-foreground p-6 rounded-xl overflow-x-auto font-mono text-sm border shadow-inner">
              {`# Create project
buncf init

# Dev mode
buncf dev

# Deploy
buncf deploy`}
            </pre>
            <div className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest group-hover:text-primary/50 transition-colors">
              Bash / Zsh
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
