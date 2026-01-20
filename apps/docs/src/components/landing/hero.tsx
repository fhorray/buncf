'use client';

import { ArrowRight, Terminal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/code-block';
import { Link } from 'buncf/router';

const quickStartCode = `# Create a new project
bunx buncf init my-app

cd my-app
bun dev     # Start dev server at localhost:3000
bun deploy  # Deploy to Cloudflare Workers`;

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/5 mb-8">
          <Zap className="w-4 h-4 text-neon" />
          <span className="text-sm text-foreground/80">Built for the Edge</span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="text-foreground">The </span>
          <span className="text-neon neon-text">Bun</span>
          <span className="text-foreground"> Framework</span>
          <br />
          <span className="text-foreground">for </span>
          <span className="text-neon neon-text">Cloudflare Workers</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed text-balance">
          Build full-stack React apps with file-system routing, type-safe APIs,
          and zero-config deployment to the edge.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            asChild
            size="lg"
            className="bg-neon hover:bg-neon/90 text-primary-foreground gap-2 px-8"
          >
            <Link href="/docs">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-border hover:border-neon/50 hover:bg-neon/5 gap-2 px-8 bg-transparent"
          >
            <Link href="/docs">
              <Terminal className="w-4 h-4" />
              View Documentation
            </Link>
          </Button>
        </div>

        {/* Quick start code */}
        <div className="max-w-2xl mx-auto text-left">
          <CodeBlock
            code={quickStartCode}
            language="bash"
            filename="Quick Start"
            showLineNumbers={false}
          />
        </div>
      </div>
    </section>
  );
}
