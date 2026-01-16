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
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            Post Not Found
          </h1>
          <p className="text-gray-600 mb-6">The post "{slug}" doesn't exist.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {post.title}
            </h1>
            <p className="text-gray-500">Posted on {post.date}</p>
          </header>

          <div className="prose prose-lg text-gray-600">
            <p>{post.content}</p>
          </div>

          {/* Show route params */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-500 font-mono">
              Route param: slug = "{slug}"
            </p>
          </div>
        </article>

        {/* Other posts */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Other Posts</h2>
          <div className="space-y-2">
            {Object.entries(posts)
              .filter(([key]) => key !== slug)
              .map(([key, p]) => (
                <Link
                  key={key}
                  href={`/blog/${key}`}
                  className="block text-blue-600 hover:underline"
                >
                  → {p.title}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
