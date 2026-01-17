import { Link } from "buncf/router";
import { ArrowRight, Terminal, Zap, Box, Code2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const meta = () => [{ title: "Buncf - The Bun Framework for Cloudflare" }];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Text */}
            <div className="space-y-8 text-left">
              <div className="inline-flex items-center rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-sm font-medium text-pink-500 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-pink-500 mr-2 animate-pulse"></span>
                v0.1.0 Beta is now available
              </div>
              
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Bun + Cloudflare <br className="hidden lg:block"/>
                <span className="text-pink-500">Zero Config.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Deploy Bun applications to Cloudflare Workers with zero configuration. 
                Enjoy the standard <code>Bun.serve</code> API, file-system routing, and fully typed bindings.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="h-12 px-8 text-base bg-pink-600 hover:bg-pink-700 text-white border-0 shadow-lg shadow-pink-500/20">
                  <Link href="/docs/installation">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center rounded-lg border border-muted bg-black/50 px-4 h-12 font-mono text-sm text-muted-foreground backdrop-blur-sm">
                   <span className="text-pink-500 mr-2">$</span> bun add buncf
                </div>
              </div>
            </div>

            {/* Right: Code/Visual */}
            <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
               <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl opacity-30"></div>
               <div className="relative rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl backdrop-blur-sm overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                     <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                     </div>
                     <div className="text-xs font-medium text-muted-foreground">src/server.ts</div>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <pre className="text-sm font-mono leading-relaxed">
                        <code className="text-pink-100">
                            <span className="text-pink-500">import</span> {"{"} serve {"}"} <span className="text-pink-500">from</span> <span className="text-green-400">"bun"</span>;<br/><br/>
                            <span className="text-blue-400">serve</span>({"{"}<br/>
                            &nbsp;&nbsp;<span className="text-yellow-300">fetch</span>(req) {"{"}<br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-500">return</span> <span className="text-pink-500">new</span> Response(<span className="text-green-400">"Hello Cloudflare!"</span>);<br/>
                            &nbsp;&nbsp;{"}"},<br/>
                            {"}"});
                        </code>
                    </pre>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black/20 border-t border-white/5">
        <div className="container max-w-6xl mx-auto px-6">
           <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Framework Features</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Everything you need to build scalable edge applications, powered by Bun.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:border-pink-500/20 transition-colors">
                 <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 mb-4">
                    <Zap size={24} />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Bun.serve API</h3>
                 <p className="text-muted-foreground">Write standard Bun code using `Bun.serve`. No vendor lock-in, just pure web standards.</p>
              </div>

              <div className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:border-pink-500/20 transition-colors">
                 <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                    <Box size={24} />
                 </div>
                 <h3 className="text-xl font-bold mb-2">File Routing</h3>
                 <p className="text-muted-foreground">Simply create files in `src/pages`. We support nested layouts, dynamic routes, and catch-all paths.</p>
              </div>

              <div className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:border-pink-500/20 transition-colors">
                 <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                    <Globe size={24} />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Cloudflare Native</h3>
                 <p className="text-muted-foreground">Access D1, KV, R2, and Durable Objects directly from your handlers with full type safety.</p>
              </div>
           </div>
        </div>
      </section>

    </div>
  );
}
