
import { useParams, Link } from "buncf/router";

export default function BlogPost() {
  const { slug } = useParams();

  const posts: Record<string, any> = {
    "hello-world": {
        title: "Hello World",
        content: "Buncf is a bridge between two worlds: the speed of Bun development and the reach of Cloudflare Workers. This project aims to simplify the deployment pipeline while maintaining 100% compatibility with local Bun APIs where possible."
    },
    "why-buncf": {
        title: "Why Buncf?",
        content: "Deploying to Cloudflare Workers often feels like a separate environment altogether. Buncf tries to hide that complexity by using a smart Bun plugin that injects a runtime adapter at build time."
    },
    "edge-performance": {
        title: "Edge Performance",
        content: "Performance is not just about execution speed; it's about proximity. By leveraging the URLPattern API and modular layouts, Buncf ensures your JS bundles stay lean and fast."
    }
  };

  const post = posts[slug || ""] || { title: "Post Not Found", content: "Sorry, this article doesn't exist yet." };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <Link href="/blog" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">← Back to Insights</Link>
        <h1 className="text-5xl font-black tracking-tighter">{post.title}</h1>
      </div>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-lg text-foreground/80 leading-loose italic">
          {post.content}
        </p>
        <p className="mt-8 text-muted-foreground leading-relaxed">
           This content is displayed inside the <code>/blog/[slug].tsx</code> route, 
           which is nested within <code>/blog/_layout.tsx</code>. 
           Navigation between posts only re-renders the content area, preserving the layout state.
        </p>
      </div>

      <div className="pt-10 border-t border-border mt-20 flex gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold">Enjoyed the read?</p>
            <p className="text-xs text-muted-foreground">Subscribe for more edge computing insights.</p>
          </div>
      </div>
    </div>
  );
}
