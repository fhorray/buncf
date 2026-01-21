import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Routing - Buncf' },
  { name: 'description', content: 'Overview of routing in Buncf' },
];

export default function Routing() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Routing</h1>
      <p>
        Buncf uses a file-system based router built on standard web URL patterns.
        Routes are defined by the file structure in your <code>src</code> directory.
      </p>

      <h2>Two Types of Routes</h2>
      <p>Buncf separates your application into two distinct routing domains:</p>

      <ul>
        <li>
          <strong>Page Routes</strong> (<code>src/pages</code>):
          Serve HTML and React components. These are rendered on the server (SSR) and hydrated on the client.
        </li>
        <li>
          <strong>API Routes</strong> (<code>src/api</code>):
          Serve JSON or other data. These map directly to HTTP methods.
        </li>
      </ul>

      <h2>Dynamic Segments</h2>
      <p>Both routers support dynamic segments using bracket syntax:</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2">File Name</th>
              <th className="py-2">Example URL</th>
              <th className="py-2">Params Object</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 font-mono">index.tsx</td>
              <td className="py-2 font-mono">/</td>
              <td className="py-2 font-mono">{'{}'}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 font-mono">about.tsx</td>
              <td className="py-2 font-mono">/about</td>
              <td className="py-2 font-mono">{'{}'}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 font-mono">[id].tsx</td>
              <td className="py-2 font-mono">/123</td>
              <td className="py-2 font-mono">{'{ id: "123" }'}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 font-mono">posts/[slug].tsx</td>
              <td className="py-2 font-mono">/posts/hello-world</td>
              <td className="py-2 font-mono">{'{ slug: "hello-world" }'}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 font-mono">[...rest].tsx</td>
              <td className="py-2 font-mono">/a/b/c</td>
              <td className="py-2 font-mono">{'{ rest: "a/b/c" }'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Route Priority</h2>
      <p>Routes are matched in the following order:</p>
      <ol>
        <li><strong>Static Routes:</strong> Exact matches (e.g., <code>/about</code>)</li>
        <li><strong>Dynamic Routes:</strong> Named parameters (e.g., <code>/[id]</code>)</li>
        <li><strong>Catch-all Routes:</strong> Wildcards (e.g., <code>/[...slug]</code>)</li>
      </ol>
    </div>
  );
}
