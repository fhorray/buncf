import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Installation - Buncf' },
  { name: 'description', content: 'How to install and set up Buncf' },
];

export default function Installation() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Installation</h1>

      <h2>Prerequisites</h2>
      <ul>
        <li><strong>Bun</strong> v1.0.0 or later</li>
        <li><strong>Node.js</strong> v18+ (required for Wrangler CLI)</li>
        <li><strong>Wrangler</strong> v3.0.0+ (Cloudflare CLI)</li>
      </ul>

      <h2>Creating a New Project</h2>
      <p>The easiest way to get started is using the initialization command:</p>

      <div className="not-prose my-6">
        <CodeBlock code="bunx buncf init my-app" language="bash" />
      </div>

      <p>This will:</p>
      <ol>
        <li>Create a new directory called <code>my-app</code></li>
        <li>Scaffold the project structure</li>
        <li>Install dependencies</li>
        <li>Initialize a git repository</li>
      </ol>

      <h2>Manual Installation</h2>
      <p>If you prefer to add Buncf to an existing project:</p>

      <div className="not-prose my-6">
        <CodeBlock code="bun add buncf" language="bash" />
      </div>

      <p>You will also need to configure your <code>package.json</code> scripts:</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`{
  "scripts": {
    "dev": "buncf dev",
    "build": "buncf build",
    "deploy": "buncf deploy"
  }
}`}
          language="json"
          filename="package.json"
        />
      </div>
    </div>
  );
}
