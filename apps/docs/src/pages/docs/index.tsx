export const meta = () => [
  { title: 'Introduction - Buncf' },
  { name: 'description', content: 'Introduction to Buncf framework' },
];

export default function Introduction() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Introduction</h1>
      <p className="lead">
        Buncf is a modern, type-safe full-stack framework designed specifically for
        building React applications on <strong>Cloudflare Workers</strong> using <strong>Bun</strong>.
      </p>

      <h2>Why Buncf?</h2>
      <p>
        Building for the edge shouldn't be hard. Buncf combines the developer experience of
        Next.js with the performance of Bun and the global scale of Cloudflare Workers.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 not-prose">
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-bold mb-2">⚡ Bun Powered</h3>
          <p className="text-muted-foreground">
            Leverage Bun's incredible speed for installation, testing, and bundling.
            Development server starts instantly.
          </p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-bold mb-2">☁️ Cloudflare Native</h3>
          <p className="text-muted-foreground">
            First-class support for D1, KV, R2, and other Cloudflare bindings.
            Deploy to the edge with zero config.
          </p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-bold mb-2">📁 File-System Routing</h3>
          <p className="text-muted-foreground">
            Intuitive routing for both pages and APIs.
            Just create files in <code>src/pages</code> and <code>src/api</code>.
          </p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-bold mb-2">🛡️ End-to-End Type Safety</h3>
          <p className="text-muted-foreground">
            Auto-generated typed API clients and Zod-validated Server Actions ensure
            your frontend and backend are always in sync.
          </p>
        </div>
      </div>

      <h2>Core Philosophy</h2>
      <ul>
        <li><strong>Simplicity:</strong> Minimal boilerplate. API routes are just functions. Pages are just React components.</li>
        <li><strong>Performance:</strong> Built on streaming SSR and edge computing primitives.</li>
        <li><strong>Developer Experience:</strong> Hot reload, error overlays, and typed bindings out of the box.</li>
      </ul>
    </div>
  );
}
