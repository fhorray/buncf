import { Link } from 'buncf/router';
import {
  ArrowRight,
  Zap,
  Box,
  Globe,
  Shield,
  Layout,
  Server,
  Github,
  Twitter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/code-block';

export const meta = () => [
  { title: 'Buncf - The Bun Framework for Cloudflare' },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32 px-6 w-full">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-8 text-left z-10">
              <div className="inline-flex items-center rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-sm font-medium text-pink-500 backdrop-blur-sm shadow-lg shadow-pink-500/10 animate-fade-in">
                <span className="flex h-2 w-2 rounded-full bg-pink-500 mr-2 animate-pulse"></span>
                v0.1.0 Beta is now available
              </div>

              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Bun + Cloudflare <br className="hidden lg:block" />
                <span className="text-pink-500 glow-text">Zero Config.</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Deploy Bun applications to Cloudflare Workers with zero
                configuration. Enjoy the standard <code>Bun.serve</code> API,
                file-system routing, and fully typed bindings in a unified
                developer experience.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 text-base bg-pink-600 hover:bg-pink-700 text-white border-0 shadow-xl shadow-pink-500/20 active:scale-95 transition-all duration-200"
                >
                  <Link href="/docs/installation">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center rounded-lg border border-white/10 bg-black/40 px-6 h-12 font-mono text-sm text-muted-foreground backdrop-blur-md shadow-inner">
                  <span className="text-zinc-500 select-none mr-2">$</span>{' '}
                  <span className="text-foreground">bun add buncf</span>
                </div>
              </div>
            </div>

            {/* Right: Code/Visual */}
            <div className="relative mx-auto w-full max-w-[550px] lg:max-w-none perspective-1000 hidden md:block">
              <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[100px] opacity-40 animate-blob"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-pink-500/10 blur-[120px] opacity-30 animate-blob animation-delay-2000"></div>

              <div className="relative rounded-xl border border-white/10 bg-[#0a0a0a]/80 shadow-2xl backdrop-blur-xl overflow-hidden md:transform md:rotate-y-6 md:hover:rotate-y-0 transition-transform duration-700 ease-out">
                <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f56] border border-black/10"></div>
                    <div className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-black/10"></div>
                    <div className="h-3 w-3 rounded-full bg-[#27c93f] border border-black/10"></div>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground font-mono opacity-70">
                    src/server.ts
                  </div>
                </div>
                <div className="p-0">
                  <CodeBlock
                    className="border-0 bg-transparent p-6 text-sm"
                    hideHeader
                    code={`import { serve } from "bun";

serve({
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response("Hello Cloudflare!");
    }
    return new Response("Not Found", { status: 404 });
  },
});`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Showcase Section */}
      <section className="py-24 bg-zinc-900/30 border-y border-white/5">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Write it your way
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose between standard Bun APIs or our powerful integrations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1: File System */}
            <div className="rounded-2xl border border-white/5 bg-black/40 overflow-hidden group hover:border-pink-500/20 transition-all">
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center">
                  <Layout className="w-5 h-5 mr-2 text-blue-400" /> File System
                  Routing
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  src/pages/index.tsx
                </span>
              </div>
              <div className="p-6 bg-[#0a0a0a]">
                <CodeBlock
                  className="border-0 bg-transparent p-0 text-sm"
                  hideHeader
                  code={`export default function Home() {
  return (
    <div>
      <h1>Automatic Routing</h1>
      <p>Just create a file!</p>
    </div>
  );
}`}
                />
              </div>
            </div>

            {/* Card 2: Hono */}
            <div className="rounded-2xl border border-white/5 bg-black/40 overflow-hidden group hover:border-pink-500/20 transition-all">
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center">
                  <Server className="w-5 h-5 mr-2 text-orange-400" /> Hono
                  Integration
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  src/api/[...route].ts
                </span>
              </div>
              <div className="p-6 bg-[#0a0a0a]">
                <CodeBlock
                  className="border-0 bg-transparent p-0 text-sm"
                  hideHeader
                  code={`import { Hono } from 'hono';
const app = new Hono();

app.get('/hello', (c) => {
  return c.json({ msg: 'Hybrid Power!' });
});

export default app.fetch;`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-transparent">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit to build scalable edge applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap size={24} />}
              color="text-pink-500"
              bg="bg-pink-500/10"
              title="Bun.serve API"
              description="Write standard Bun code using Bun.serve. No vendor lock-in, just pure web standards."
            />
            <FeatureCard
              icon={<Box size={24} />}
              color="text-blue-500"
              bg="bg-blue-500/10"
              title="File Routing"
              description="Intuitive file-system routing. Support for nested layouts, dynamic params, and catch-all paths."
            />
            <FeatureCard
              icon={<Globe size={24} />}
              color="text-purple-500"
              bg="bg-purple-500/10"
              title="Cloudflare Native"
              description="Access D1, KV, R2, and Durable Objects directly from your handlers with full type safety."
            />
            <FeatureCard
              icon={<Server size={24} />}
              color="text-orange-500"
              bg="bg-orange-500/10"
              title="Hono Hybrids"
              description="Seamlessly integrate Hono for complex APIs while keeping filesystem routing for pages."
            />
            <FeatureCard
              icon={<Layout size={24} />}
              color="text-cyan-500"
              bg="bg-cyan-500/10"
              title="Tailwind & UI"
              description="Pre-configured with TailwindCSS and shadcn/ui. Look good by default."
            />
            <FeatureCard
              icon={<Shield size={24} />}
              color="text-green-500"
              bg="bg-green-500/10"
              title="Zero Config"
              description="Deploy to Cloudflare Workers with a single command. We handle the bundling and compatibility."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Buncf</h3>
              <p className="text-sm text-muted-foreground">
                The modern framework for building high-performance edge
                applications with Bun and Cloudflare.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">
                Documentation
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/docs/installation"
                    className="hover:text-pink-500 transition"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/routing"
                    className="hover:text-pink-500 transition"
                  >
                    Routing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/hooks"
                    className="hover:text-pink-500 transition"
                  >
                    Hooks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/deployment"
                    className="hover:text-pink-500 transition"
                  >
                    Deployment
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">
                Integrations
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/docs/examples#hono-integration"
                    className="hover:text-pink-500 transition"
                  >
                    Hono
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/examples#better-auth"
                    className="hover:text-pink-500 transition"
                  >
                    Better Auth
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/bindings"
                    className="hover:text-pink-500 transition"
                  >
                    D1 & KV
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">
                Community
              </h4>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/francyelton/buncf"
                  target="_blank"
                  className="text-muted-foreground hover:text-white transition"
                >
                  <Github size={20} />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-white transition"
                >
                  <Twitter size={20} />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Buncf. Released under MIT
              License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, color, bg, title, description }: any) {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-pink-500/20 transition-all duration-300 group">
      <div
        className={`h-12 w-12 rounded-lg ${bg} flex items-center justify-center ${color} mb-4 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-foreground/90">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}
