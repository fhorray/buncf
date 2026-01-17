/**
 * Dynamic Blog Post Page
 * URL: /blog/:slug
 *
 * Demonstrates: useParams hook for dynamic route parameters
 */
import { useParams, Link } from 'buncf/router';

// Mock blog posts
const posts: Record<string, { title: string; content: string; date: string }> =
  {
    'hello-world': {
      title: 'Hello World',
      content: 'This is the first post on our blog. Welcome to Buncf!',
      date: '2024-01-15',
    },
    'getting-started': {
      title: 'Getting Started with Buncf',
      content:
        'Learn how to build fast edge applications with Bun and Cloudflare Workers.',
      date: '2024-01-16',
    },
  };

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts[slug] || null;

  if (!post) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 pt-10 px-4">
        <div className="w-20 h-20 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Post Not Found</h1>
        <p className="text-muted-foreground text-center max-w-sm">The article "{slug}" couldn't be located in our edge directory.</p>
        <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity">
            Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Link
        href="/blog"
        className="text-sm font-medium text-primary hover:underline underline-offset-4 mb-8 inline-block"
      >
        ← Back to Blog
      </Link>

      <article className="space-y-10 group">
        <header className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">Buncf Edge</span>
                <span>•</span>
                <time className="text-muted-foreground">{post.date}</time>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tighter leading-tight text-foreground">
                {post.title}
            </h1>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none text-xl leading-relaxed text-muted-foreground border-l-2 border-primary/20 pl-8 italic">
            {post.content}
        </div>

        <div className="p-8 rounded-3xl bg-muted/40 border border-border shadow-inner">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Route Information</h3>
            <div className="flex flex-wrap gap-4">
                <div className="px-3 py-1.5 rounded-md bg-background border text-xs font-mono">
                    <span className="text-muted-foreground mr-2">PARAM:</span>
                    <span className="text-primary font-bold">{slug}</span>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-background border text-xs font-mono">
                    <span className="text-muted-foreground mr-2">SOURCE:</span>
                    <span className="text-foreground">pages/blog/[slug].tsx</span>
                </div>
            </div>
        </div>
      </article>

      {/* Suggested Reading */}
      <section className="mt-20 pt-10 border-t">
        <h2 className="text-2xl font-bold mb-6 tracking-tight">Suggested Reading</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(posts)
            .filter(([key]) => key !== slug)
            .map(([key, p]) => (
              <Link
                key={key}
                href={`/blog/${key}`}
                className="group p-5 rounded-2xl border bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
              >
                <div className="text-xs text-muted-foreground mb-2">{p.date}</div>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{p.content}</p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
