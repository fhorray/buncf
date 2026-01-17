
export const homePage = (features: string[]) => {
  const hasAuth = features.includes("auth");
  const hasDrizzle = features.includes("drizzle");
  const hasShadcn = features.includes("shadcn");

  return `
import { Link } from "buncf/router";
import { Zap, Shield, Database, Layout, ArrowRight, Github } from "lucide-react";
${hasShadcn ? 'import { Button } from "@/components/ui/button";' : ''}
${hasShadcn ? 'import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";' : ''}

export default function Home() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <header className="py-20 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium">
          <Zap size={16} /> Multi-stack Project Initialized
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight">
          Welcome to <span className="text-blue-500 italic">Buncf</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Your modern full-stack framework for Bun and Cloudflare Workers is ready.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg"><Link href="/docs">Read Documentation</Link></Button>
          <Button variant="outline" size="lg" asChild>
            <a href="https://github.com/francyelton/buncf" target="_blank">
              <Github className="mr-2 h-4 w-4" /> GitHub
            </a>
          </Button>
        </div>
      </header>

      {/* Feature Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Core Feature */}
          <Card>
            <CardHeader>
              <Layout className="text-blue-500 mb-2" />
              <CardTitle>File Routing</CardTitle>
              <CardDescription>Automatically mapped from your src/pages directory.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button variant="link" className="px-0" asChild>
                 <Link href="/playground">Open Playground UI <ArrowRight className="ml-2 h-4 w-4" /></Link>
               </Button>
            </CardContent>
          </Card>

          ${hasAuth ? `
          <Card>
            <CardHeader>
              <Shield className="text-blue-500 mb-2" />
              <CardTitle>Better Auth</CardTitle>
              <CardDescription>Secure authentication with Cloudflare D1 integration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
               <Button variant="link" className="px-0 w-full justify-start" asChild>
                 <Link href="/auth/login">Login Example</Link>
               </Button>
               <Button variant="link" className="px-0 w-full justify-start" asChild>
                 <Link href="/auth/register">Register Example</Link>
               </Button>
            </CardContent>
          </Card>
          ` : ""}

          ${hasDrizzle ? `
          <Card>
            <CardHeader>
              <Database className="text-blue-500 mb-2" />
              <CardTitle>Drizzle ORM</CardTitle>
              <CardDescription>Type-safe database access for Cloudflare D1.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button variant="link" className="px-0 w-full justify-start" asChild>
                 <Link href="/admin/users">User Management (Drizzle)</Link>
               </Button>
            </CardContent>
          </Card>
          ` : ""}
        </div>
      </main>
    </div>
  );
}
  `;
};
