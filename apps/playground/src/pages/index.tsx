/**
 * Home Page Component
 * URL: /
 *
 * Demonstrates: useRouter hook for navigation
 */
import { useRouter, Link } from 'buncf/router';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-indigo-600 mb-4">
          🚀 Welcome to Buncf
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          File-system routing for Bun + Cloudflare Workers
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Navigation Examples */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">📄 Pages</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-blue-600 hover:underline">
                  → About Page
                </Link>
              </li>
              <li>
                <Link
                  href="/blog/hello-world"
                  className="text-blue-600 hover:underline"
                >
                  → Blog Post (dynamic)
                </Link>
              </li>
              <li>
                <Link href="/users" className="text-blue-600 hover:underline">
                  → Users List
                </Link>
              </li>
            </ul>
          </div>

          {/* API Examples */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">🔌 API Routes</h2>
            <ul className="space-y-3">
              <li>
                <a
                  href="/api/hello"
                  target="_blank"
                  className="text-green-600 hover:underline"
                >
                  GET /api/hello
                </a>
              </li>
              <li>
                <a
                  href="/api/users"
                  target="_blank"
                  className="text-green-600 hover:underline"
                >
                  GET /api/users
                </a>
              </li>
              <li>
                <a
                  href="/api/users/1"
                  target="_blank"
                  className="text-green-600 hover:underline"
                >
                  GET /api/users/1
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Current Route Info */}
        <div className="mt-8 bg-gray-800 text-green-400 rounded-xl p-6 font-mono">
          <p>Current Path: {router.pathname}</p>
          <p>Params: {JSON.stringify(router.params)}</p>
          <p>Query: {JSON.stringify(router.query)}</p>
        </div>

        {/* Programmatic Navigation */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/about')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to About (push)
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
