import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'CLI Reference - Buncf' },
  { name: 'description', content: 'Command Line Interface reference for Buncf' },
];

export default function Cli() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>CLI Reference</h1>
      <p>
        The <code>buncf</code> CLI is your primary tool for developing, building, and deploying applications.
      </p>

      <h2>Commands</h2>

      <h3><code>init [name]</code></h3>
      <p>Scaffolds a new Buncf project.</p>
      <ul>
        <li><code>name</code> (optional): The name of the directory to create.</li>
      </ul>

      <h3><code>dev</code></h3>
      <p>Starts the local development server.</p>
      <ul>
        <li><code>--remote</code>: Use live Cloudflare bindings (D1, KV, R2) instead of local simulation.</li>
        <li><code>--port, -p</code>: Specify port (default: 3000).</li>
      </ul>

      <h3><code>build</code></h3>
      <p>Compiles the application for production.</p>
      <ul>
        <li>Generates the worker bundle.</li>
        <li>Bundles client-side assets.</li>
        <li>Optimizes CSS and images.</li>
      </ul>

      <h3><code>deploy</code></h3>
      <p>Builds the application and deploys it to Cloudflare Workers.</p>
      <ul>
        <li>Wraps <code>wrangler deploy</code>.</li>
      </ul>

      <h3><code>types</code></h3>
      <p>Generates TypeScript definitions for Cloudflare bindings.</p>
      <ul>
        <li>Reads <code>wrangler.json</code>.</li>
        <li>Updates <code>.buncf/cloudflare-env.d.ts</code>.</li>
      </ul>

      <h2>Global Options</h2>
      <ul>
        <li><code>--help, -h</code>: Show help information.</li>
        <li><code>--version, -v</code>: Show version number.</li>
      </ul>
    </div>
  );
}
