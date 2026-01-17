
import { Link } from "buncf/router";

// Mock loader to simulate dynamic data
export const loader = async () => {
  return { 
    title: "Awesome Page", 
    description: "This page was rendered with dynamic SEO meta tags.",
    timestamp: new Date().toISOString()
  };
};

// Dynamic SEO Metadata
export const meta = ({ data }: { data: any }) => [
  { title: `Buncf | ${data?.title || "Meta Test"}` },
  { name: "description", content: data?.description || "Testing SEO" },
  { name: "keywords", content: "bun, cloudflare, seo, react" },
  { property: "og:type", content: "website" }
];

export default function MetaTest({ data }: { data: any }) {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">SEO & Metadata</h1>
            <p className="text-muted-foreground text-lg">Testing <code>export const meta</code> for document head injection.</p>
        </header>

        <section className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-8">
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Inspection Results
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                    Check the browser tab title or inspect the <code>{"<head>"}</code> of this document. 
                    You should see dynamic tags injected from the loader data.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Title</span>
                    <p className="text-lg font-bold text-primary">Buncf | {data?.title}</p>
                </div>
                <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</span>
                    <p className="text-sm font-medium text-foreground/80">{data?.description}</p>
                </div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-white/5 p-6 font-mono text-xs">
                <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-4">Injected Payload (from Loader)</p>
                <pre className="text-foreground/70 overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </section>

        <div className="flex justify-center pt-8">
            <Link href="/" className="text-sm font-bold text-primary hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
