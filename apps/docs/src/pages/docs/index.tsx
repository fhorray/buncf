import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation } from "@/components/docs/doc-components";
import { 
  BookOpen,
  FolderTree,
  Code2,
  Lock,
  Zap,
} from "lucide-react";

export default function IntroductionPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={BookOpen}
        title="Introduction"
        description="Learn what buncf is and why it's the perfect choice for building full-stack React apps on Cloudflare Workers."
      />

      <section className="mb-10">
        <Paragraph>
          <strong className="text-foreground">buncf</strong> is a modern full-stack framework built on Bun, 
          designed specifically for Cloudflare Workers. It combines the best of Next.js-style routing 
          with first-class Cloudflare integration, type safety, and an incredible developer experience.
        </Paragraph>
        
        <Paragraph>
          Whether you're building a simple API, a complex web application, or anything in between, 
          buncf provides the tools you need to move fast without sacrificing quality or performance.
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Why buncf?</h2>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          {[
            { icon: FolderTree, title: "File-System Routing", desc: "Next.js-style pages and API routes with zero configuration" },
            { icon: Code2, title: "React 19 Ready", desc: "Full React support with streaming SSR and server components" },
            { icon: Lock, title: "Magic Bindings", desc: "Import D1, KV, R2 directly without passing context around" },
            { icon: Zap, title: "Type-Safe APIs", desc: "Auto-generated typed fetch client for end-to-end type safety" },
          ].map((feature) => (
            <div key={feature.title} className="p-4 rounded-lg border border-border/50 bg-card/50 hover:border-neon/30 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <feature.icon className="w-5 h-5 text-neon" />
                <h4 className="font-semibold">{feature.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Quick Example</h2>
        <Paragraph>
          Here's a taste of what building with buncf looks like:
        </Paragraph>
        <CodeBlock
          code={`// src/api/hello.ts
import { defineHandler } from 'buncf';

export const GET = defineHandler(() => {
  return Response.json({ message: 'Hello from the edge!' });
});`}
          language="typescript"
          filename="src/api/hello.ts"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Ready to get started?</h2>
        <Paragraph>
          Head over to the Quick Start guide to create your first buncf project in under a minute.
        </Paragraph>
      </section>

      <DocNavigation
        next={{ href: "/docs/quick-start", label: "Quick Start" }}
      />
    </article>
  );
}
