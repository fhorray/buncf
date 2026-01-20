import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { CodeExamples } from '@/components/landing/code-examples';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Rocket, Cloud } from 'lucide-react';
import { Link } from 'buncf/router';

export default function HomePage() {
  return (
    <main className="pt-16">
      <Hero />
      <Features />
      <CodeExamples />

      {/* Project Structure Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Intuitive
              <span className="text-neon"> project structure</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Organized file system with clear conventions. Everything has its
              place.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-code-bg p-6 font-mono text-sm">
            <pre className="text-muted-foreground leading-relaxed">
              {`my-app/
 ├── src/
 │   ├── index.ts          `}
              <span className="text-muted-foreground/60">
                # Server entry (optional)
              </span>
              {`
 │   ├── index.html        `}
              <span className="text-muted-foreground/60"># HTML template</span>
              {`
 │   ├── client.tsx        `}
              <span className="text-muted-foreground/60">
                # Client entry (React)
              </span>
              {`
 │   ├── globals.css       `}
              <span className="text-muted-foreground/60">
                # Tailwind/global styles
              </span>
              {`
 │   │
 │   ├── api/              `}
              <span className="text-neon"># API Routes</span>
              {`
 │   │   ├── hello.ts          `}
              <span className="text-muted-foreground/60">
                → GET/POST /api/hello
              </span>
              {`
 │   │   ├── users/
 │   │   │   ├── index.ts      `}
              <span className="text-muted-foreground/60">→ /api/users</span>
              {`
 │   │   │   └── [id].ts       `}
              <span className="text-muted-foreground/60">→ /api/users/:id</span>
              {`
 │   │   └── [...route].ts     `}
              <span className="text-muted-foreground/60">→ Hono catch-all</span>
              {`
 │   │
 │   └── pages/            `}
              <span className="text-neon"># Page Routes</span>
              {`
 │       ├── _layout.tsx       `}
              <span className="text-muted-foreground/60"># Root layout</span>
              {`
 │       ├── _loading.tsx      `}
              <span className="text-muted-foreground/60"># Loading state</span>
              {`
 │       ├── _error.tsx        `}
              <span className="text-muted-foreground/60"># Error boundary</span>
              {`
 │       ├── _notfound.tsx     `}
              <span className="text-muted-foreground/60"># 404 page</span>
              {`
 │       ├── index.tsx         `}
              <span className="text-muted-foreground/60">→ /</span>
              {`
 │       └── dashboard/
 │           ├── _layout.tsx   `}
              <span className="text-muted-foreground/60"># Nested layout</span>
              {`
 │           └── index.tsx     `}
              <span className="text-muted-foreground/60">→ /dashboard</span>
              {`
 │
 ├── public/               `}
              <span className="text-muted-foreground/60"># Static assets</span>
              {`
 ├── .buncf/               `}
              <span className="text-muted-foreground/60">
                # Generated (gitignored)
              </span>
              {`
 └── wrangler.json         `}
              <span className="text-muted-foreground/60">
                # Cloudflare config
              </span>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-neon/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-neon/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/5 mb-8">
            <Sparkles className="w-4 h-4 text-neon" />
            <span className="text-sm text-foreground/80">
              Ready for production
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start building
            <span className="text-neon neon-text"> today</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Get up and running in minutes. Deploy to Cloudflare Workers with a
            single command.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-neon hover:bg-neon/90 text-primary-foreground gap-2 px-8"
            >
              <Link href="/docs">
                <Rocket className="w-4 h-4" />
                Get Started
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-border hover:border-neon/50 hover:bg-neon/5 gap-2 px-8 bg-transparent"
            >
              <a
                href="https://github.com/francyelton/buncf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Cloud className="w-4 h-4" />
                View on GitHub
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
