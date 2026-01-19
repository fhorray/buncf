import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from 'buncf/router';
import {
  Zap,
  Shield,
  Database,
  Layout,
  ArrowRight,
  Github,
} from 'lucide-react';

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
          Your modern full-stack framework for Bun and Cloudflare Workers is
          ready.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/docs">Read Documentation</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="https://github.com/francyelton/buncf" target="_blank">
              <Github className="mr-2 h-4 w-4" /> GitHub
            </a>
          </Button>
        </div>
      </header>
    </div>
  );
}
