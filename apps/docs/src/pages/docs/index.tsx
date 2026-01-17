import React from "react";
import { Link } from "buncf/router";
import { ArrowRight, Book, Zap, Layers, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export const meta = () => [{ title: "Documentation - Buncf" }];

export default function DocsIndex() {
  return (
    <div className="space-y-12 max-w-5xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Learn how to build and deploy applications with Buncf.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/docs/installation" className="group relative rounded-xl border border-border/50 bg-[#0a0a0a] p-6 shadow-sm transition-all hover:bg-zinc-900 hover:border-pink-500/20">
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500 group-hover:text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                <Zap className="h-6 w-6" />
             </div>
             <h3 className="font-semibold text-lg">Quick Start</h3>
          </div>
          <p className="text-muted-foreground text-sm">
             Install Buncf and create your first project in less than a minute.
          </p>
        </Link>
        
        <Link href="/docs/routing" className="group relative rounded-xl border border-border/50 bg-[#0a0a0a] p-6 shadow-sm transition-all hover:bg-zinc-900 hover:border-blue-500/20">
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <Book className="h-6 w-6" />
             </div>
             <h3 className="font-semibold text-lg">Routing</h3>
          </div>
          <p className="text-muted-foreground text-sm">
             Master File-System Routing, Dynamic API Routes, and Hono integration.
          </p>
        </Link>

        <Link href="/docs/layouts" className="group relative rounded-xl border border-border/50 bg-[#0a0a0a] p-6 shadow-sm transition-all hover:bg-zinc-900 hover:border-purple-500/20">
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Layers className="h-6 w-6" />
             </div>
             <h3 className="font-semibold text-lg">Layouts & Meta</h3>
          </div>
          <p className="text-muted-foreground text-sm">
             Create nested layouts and manage SEO metadata efficiently.
          </p>
        </Link>

        <Link href="/docs/deployment" className="group relative rounded-xl border border-border/50 bg-[#0a0a0a] p-6 shadow-sm transition-all hover:bg-zinc-900 hover:border-green-500/20">
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover:text-green-400 group-hover:bg-green-500/20 transition-colors">
                <Server className="h-6 w-6" />
             </div>
             <h3 className="font-semibold text-lg">Deployment</h3>
          </div>
          <p className="text-muted-foreground text-sm">
             Deploy to Cloudflare Workers with zero configuration.
          </p>
        </Link>
      </div>

    </div>
  );
}
