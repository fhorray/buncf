
import { Link } from "buncf/router";

export default function BlogIndex() {
  const posts = [
    { 
      title: "Hello World", 
      slug: "hello-world", 
      date: "Oct 24, 2023",
      excerpt: "Establishing the first connection between Bun and Cloudflare Workers." 
    },
    { 
      title: "Why Buncf?", 
      slug: "why-buncf", 
      date: "Oct 25, 2023",
      excerpt: "Exploring the rationale behind another meta-framework in 2023." 
    },
    { 
      title: "Edge Performance", 
      slug: "edge-performance", 
      date: "Oct 26, 2023",
      excerpt: "Measuring cold starts and latency in the edge-first era." 
    }
  ];

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter">Insights</h1>
        <p className="text-muted-foreground text-lg italic">The latest from the Buncf ecosystem.</p>
      </div>

      <div className="grid gap-8">
        {posts.map(post => (
          <article key={post.slug} className="group relative rounded-3xl border border-border bg-card/30 p-8 hover:border-primary/50 transition-all duration-300">
            <Link href={`/blog/${post.slug}`} className="absolute inset-0" />
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{post.date}</span>
              <h2 className="text-3xl font-bold tracking-tight group-hover:text-primary transition-colors">{post.title}</h2>
              <p className="text-muted-foreground leading-relaxed max-w-xl">{post.excerpt}</p>
              <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-2 transition-transform">
                Read Story <span>→</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
