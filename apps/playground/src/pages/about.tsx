/**
 * About Page Component
 * URL: /about
 */
import { Link } from 'buncf/router';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-800 mb-6">About Buncf</h1>

        <div className="prose prose-lg">
          <p className="text-gray-600 mb-4">
            Buncf is a zero-config adapter for deploying Bun applications to
            Cloudflare Workers.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>File-system based routing (pages + API)</li>
            <li>React hooks: useRouter, useParams, useSearchParams</li>
            <li>Built-in Tailwind CSS support</li>
            <li>Public folder for static assets</li>
            <li>Zero configuration deployment</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Quick Start</h2>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto">
            {`# Create new project
buncf init

# Start development
buncf dev

# Deploy to Cloudflare
buncf deploy`}
          </pre>
        </div>
      </div>
    </div>
  );
}
